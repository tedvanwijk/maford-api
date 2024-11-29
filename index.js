const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(bodyParser.json())
let origin;
if (process.env.NODE_ENV === 'production') origin = 'http://deploy-mah4vh4n:3000'
else origin = 'http://localhost:3000'
const corsOptions = {
    origin
}
app.use(cors(corsOptions));

const port = 5000;

const { execFile, spawn } = require('child_process');
let childProcess;
const path = require('path');
const { loadTools, convertCatalogToolFormatting, convertCatalogMetricUnits } = require('./lib/catalogToolLoader');

app.get('/', (req, res) => {
    res.send('Hello World!')
})

// #region series
app.get('/series', async (req, res) => {
    const result = await prisma.series.findMany({
        select: {
            name: true,
            series_id: true,
            tools: true
        }
    });
    return res.json(result);
})

app.get('/series/:series_id', async (req, res) => {
    const result = await prisma.series.findUnique({
        where: {
            series_id: parseInt(req.params.series_id)
        },
        include: {
            _count: {
                select: {
                    catalog_tools: true
                }
            }
        }
    })
    return res.json(result);
})

app.put('/series/:series_id', async (req, res) => {
    let updatedSeriesData = { ...req.body };
    delete updatedSeriesData.series_input;
    updatedSeriesData.flute_count = parseInt(updatedSeriesData.flute_count);
    updatedSeriesData.helix_angle = parseInt(updatedSeriesData.helix_angle);

    let seriesInputQueries = [];
    // second loop turns each array entry (which is an object containing name etc.) into a prisma query
    for (let i = 0; i < req.body.seriesInputLength; i++) {
        let updatedInputData = req.body.series_input[i];
        updatedInputData.catalog_index = parseInt(updatedInputData.catalog_index);
        seriesInputQueries.push(
            prisma.series_inputs.upsert({
                where: {
                    seriesIdIndex: {
                        index: i,
                        series_id: parseInt(req.params.series_id)
                    }
                },
                update: updatedInputData,
                create: {
                    ...updatedInputData,
                    index: i,
                    series_id: parseInt(req.params.series_id)
                }
            })
        )
    }

    if (req.body.oldSeriesInputLength > req.body.seriesInputLength) {
        // if true it means inputs have been removed
        const removedInputCount = req.body.oldSeriesInputLength - req.body.seriesInputLength;
        for (let i = 0; i < removedInputCount; i++) {
            seriesInputQueries.push(
                prisma.series_inputs.delete({
                    where: {
                        seriesIdIndex: {
                            index: (req.body.oldSeriesInputLength - (i + 1)),
                            series_id: parseInt(req.params.series_id)
                        }
                    }
                })
            )
        }
    }

    delete updatedSeriesData.seriesInputLength;
    delete updatedSeriesData.oldSeriesInputLength;
    const result = await prisma.$transaction([
        prisma.series.update({
            where: {
                series_id: parseInt(req.params.series_id)
            },
            data: updatedSeriesData,
            include: {
                _count: {
                    select: {
                        catalog_tools: true
                    }
                }
            }
        }),
        ...seriesInputQueries
    ])

    res.status(200).json(result[0]);
})

app.post('/series/:tool_id/new', async (req, res) => {
    let updatedSeriesData = { ...req.body };
    let updatedInputData = [...req.body.series_input];
    delete updatedSeriesData.series_input;
    updatedSeriesData.flute_count = parseInt(updatedSeriesData.flute_count);
    updatedSeriesData.helix_angle = parseInt(updatedSeriesData.helix_angle);

    updatedInputData.forEach((e, i) => { e.index = i });

    delete updatedSeriesData.seriesInputLength;
    const result = await prisma.series.create({
        data: {
            ...updatedSeriesData,
            tool_id: parseInt(req.params.tool_id),
            series_inputs: {
                create: updatedInputData
            }
        },
        include: {
            _count: {
                select: {
                    catalog_tools: true
                }
            }
        }
    });

    return res.status(201).json(result);
})

app.delete('/series/:series_id', async (req, res) => {
    const result = await prisma.series.delete({
        where: {
            series_id: parseInt(req.params.series_id)
        }
    });

    res.status(200).json(result);
})

app.get('/series/tool_id/:tool_id', async (req, res) => {
    const result = await prisma.series.findMany({
        where: {
            tool_id: parseInt(req.params.tool_id)
        },
        include: {
            _count: {
                select: {
                    catalog_tools: true
                }
            }
        }
    });
    return res.json(result);
})

app.get('/series/:series_id/inputs', async (req, res) => {
    const result = await prisma.series_inputs.findMany({
        where: {
            series_id: parseInt(req.params.series_id),
        },
        orderBy: {
            index: 'asc'
        }
    });
    return res.json(result);
})

// #endregion

// #region tools
app.get('/tools', async (req, res) => {
    const result = await prisma.tools.findMany();
    res.status(200).json(result);
})

app.get('/tools/:tool_id/inputs/by_type', async (req, res) => {
    const result = await prisma.tool_inputs.findMany({
        where: {
            tool_id: parseInt(req.params.tool_id),
            type: {
                in: ['decimal', 'toggle']
            }
        },
        select: {
            client_name: true,
            property_name: true,
            type: true,
            tool_input_categories: {
                select: {
                    display_title: true,
                    name: true
                }
            }
        },
        orderBy: [
            {
                type: 'asc'
            }
        ]
    });

    let decimalInputs = [];
    let toggleInputs = [];
    let decimalEndFound = false;

    for (let i = 0; i < result.length; i++) {
        if (result[i].type === 'toggle') decimalEndFound = true;
        if (!decimalEndFound) decimalInputs.push(result[i]);
        else toggleInputs.push(result[i]);
    }

    decimalInputs.sort((a, b) => {
        let aName = a.client_name;
        if (a.tool_input_categories.name !== null) aName = `${a.tool_input_categories.display_title}: ${aName}`;
        aName = aName.toLowerCase();
        let bName = b.client_name;
        if (b.tool_input_categories.name !== null) bName = `${b.tool_input_categories.display_title}: ${bName}`;
        bName = bName.toLowerCase();

        if (aName < bName) return -1;
        else return 1;
    });

    toggleInputs.sort((a, b) => {
        let aName = a.client_name;
        if (a.tool_input_categories.name !== null) aName = `${a.tool_input_categories.display_title}: ${aName}`;
        aName = aName.toLowerCase();
        let bName = b.client_name;
        if (b.tool_input_categories.name !== null) bName = `${b.tool_input_categories.display_title}: ${bName}`;
        bName = bName.toLowerCase();

        if (aName < bName) return -1;
        else return 1;
    });

    res.status(200).json({ decimalInputs, toggleInputs });
})

app.get('/tool/:tool_id/inputs', async (req, res) => {
    let toolCategories, defaultValues;
    if (req.query.name === 'true') {
        [toolCategories, defaultValues] = await prisma.$transaction([
            prisma.tool_input_categories.findMany({
                where: {
                    OR: [
                        {
                            tools: {
                                name: req.params.tool_id
                            }
                        },
                        {
                            common: true
                        }
                    ]
                },
                orderBy: {
                    common: 'asc'
                },
                include: {
                    tool_inputs: {
                        orderBy: [
                            {
                                group: 'asc'
                            },
                            {
                                order: 'asc'
                            }
                        ],
                        include: {
                            tool_input_rules: {
                                include: {
                                    tool_dependency_inputs_1: {
                                        select: {
                                            property_name: true,
                                            tool_input_categories: {
                                                select: {
                                                    name: true
                                                }
                                            }
                                        }
                                    },
                                    tool_dependency_inputs_2: {
                                        select: {
                                            property_name: true,
                                            tool_input_categories: {
                                                select: {
                                                    name: true
                                                }
                                            }
                                        }
                                    },
                                    tool_inputs: {
                                        select: {
                                            property_name: true
                                        }
                                    }
                                },
                                orderBy: {
                                    disable: 'desc'
                                }
                            }
                        }
                    }
                }
            }),
            prisma.default_input_values.findMany({
                where: {
                    new_tool: true,
                    tool_inputs: {
                        tool_id: parseInt(req.params.tool_id)
                    }
                },
                include: {
                    tool_inputs: {
                        select: {
                            type: true,
                            property_name: true
                        }
                    }
                }
            })
        ]);
    } else {
        [toolCategories, defaultValues] = await prisma.$transaction([
            prisma.tool_input_categories.findMany({
                where: {
                    OR: [
                        {
                            tool_id: parseInt(req.params.tool_id)
                        },
                        {
                            common: true
                        }
                    ]
                },
                orderBy: {
                    common: 'asc'
                },
                include: {
                    tool_inputs: {
                        orderBy: [
                            {
                                group: 'asc'
                            },
                            {
                                order: 'asc'
                            }
                        ],
                        include: {
                            tool_input_rules: {
                                include: {
                                    tool_dependency_inputs_1: {
                                        select: {
                                            property_name: true,
                                            tool_input_categories: {
                                                select: {
                                                    name: true
                                                }
                                            }
                                        }
                                    },
                                    tool_dependency_inputs_2: {
                                        select: {
                                            property_name: true,
                                            tool_input_categories: {
                                                select: {
                                                    name: true
                                                }
                                            }
                                        }
                                    },
                                    tool_inputs: {
                                        select: {
                                            property_name: true
                                        }
                                    }
                                },
                                orderBy: {
                                    disable: 'desc'
                                }
                            }
                        }
                    }
                }
            }),
            prisma.default_input_values.findMany({
                where: {
                    new_tool: true,
                    tool_inputs: {
                        tool_id: parseInt(req.params.tool_id)
                    }
                },
                include: {
                    tool_inputs: {
                        select: {
                            type: true,
                            property_name: true
                        }
                    }
                }
            })
        ]);
    }

    // return res.status(200).json(commonToolInputs)
    return res.status(200).json({ toolCategories, defaultValues });
})

// #endregion

// #region specifications

app.get('/specifications', async (req, res) => {
    let { p, u, s } = req.query;
    if (u === undefined || u === 'undefined') u = null;
    let filterUser = !(u === 'null' || u === null || u === -1 || u === '' || u === undefined);
    let search = s !== '';
    let page = parseInt(p);
    const specsPerPage = 15;
    const [count, specs, version] = await prisma.$transaction([
        prisma.specifications.count({
            where: {
                ...(filterUser ? { user_id: parseInt(u) } : {}),
                ...(search ? {
                    OR: [
                        {
                            name: {
                                contains: s
                            }
                        },
                        {
                            users: {
                                name: {
                                    contains: s
                                }
                            }
                        }
                    ]
                } : {})
            }
        }),
        prisma.specifications.findMany({
            where: {
                ...(filterUser ? { user_id: parseInt(u) } : {}),
                ...(search ? {
                    OR: [
                        {
                            name: {
                                contains: s
                            }
                        },
                        {
                            users: {
                                name: {
                                    contains: s
                                }
                            }
                        }
                    ]
                } : {})
            },
            select: {
                specification_id: true,
                users: true,
                status: true,
                name: true,
                versions: {
                    select: {
                        active: true
                    }
                },
                tools: {
                    select: {
                        name: true
                    }
                }
            },
            take: specsPerPage,
            skip: specsPerPage * page,
            orderBy: {
                specification_id: 'desc'
            }
        })
    ])
    return res.status(200).json({ specs: specs, pages: Math.ceil(count / specsPerPage) });
})

app.get('/specification/:specification_id', async (req, res) => {
    const spec = await prisma.specifications.findUnique({
        where: {
            specification_id: parseInt(req.params.specification_id)
        },
        include: {
            versions: {
                select: {
                    active: true
                }
            }
        }
    })
    res.status(200).json(spec);
})

app.put('/specifications/cancel/:specification_id', async (req, res) => {
    const spec = await prisma.specifications.findUnique({
        where: {
            specification_id: parseInt(req.params.specification_id)
        },
        select: {
            status: true
        }
    });
    const status = spec.status;
    if (status === 'finished' || status === 'canceled' || status === 'failed') return res.sendStatus(204);
    await prisma.specifications.update({
        where: {
            specification_id: parseInt(req.params.specification_id)
        },
        data: {
            status: 'canceled'
        }
    });
    if (status === 'pending') return res.sendStatus(204);
    if (childProcess !== undefined) childProcess.kill();
    res.sendStatus(204);
})

app.post('/specifications/new', async (req, res) => {
    const specCount = await prisma.specifications.count({
        where: {
            status: {
                in: ['pending', 'generating']
            }
        }
    });
    // req.body.ToolType later gets changed to the name to work with C#, so store it in a different var
    const toolId = req.body.ToolType;

    // convert series inputs to inputs array
    const seriesInputs = await prisma.series_inputs.findMany({
        where: {
            series_id: parseInt(req.body.ToolSeries),
        },
        orderBy: {
            index: 'asc'
        }
    });
    let seriesInputArray = [];
    seriesInputs.forEach(e => {
        let value;
        switch (e.type) {
            case 'var':
                value = req.body[e.name];
                if (value !== undefined) {
                    if (value.toString().startsWith('.') || value.toString().startsWith(',')) value = `0${value}`
                }
                seriesInputArray.push(value);
                break;
            case 'unit':
            case 'cst':
                seriesInputArray.push(e.value);
                break;
            case 'toggle':
                value = req.body[e.name];
                // if the toggle is set to true, we push the string in the value column, otherwise just an empty string
                if (value !== undefined) value ? seriesInputArray.push(e.value) : seriesInputArray.push('');
                break;
            default:
                seriesInputArray.push(req.body[e.name])
        }
    });
    req.body.ToolSeriesInputs = seriesInputArray;
    delete req.body.seriesInputs;

    // for blank tools, a bunch of parameters are not set. These need to be set in order for the controller not to crash
    // (any values set in SWController.cs need to be set)
    if (toolId === 2) {
        req.body.LOC = req.body.LOA;
        req.body.LOF = req.body.LOA;
        req.body.ShankDiameter = req.body.ToolDiameter;
        req.body.BodyLengthSameAsLOF = true;
        req.body.Coolant.CoolantPatternAlongFluting = false;
        req.body.ToolSeriesFileName = '';
        req.body.ToolSeriesInputRange = '';
        req.body.ToolSeriesOutputRange = '';
    }

    // for ems LOF should be equal to LOC
    if (toolId === 0) req.body.LOF = req.body.LOC;

    // for drills LOC should initially be equal to LOF
    if (toolId === 1) req.body.LOC = req.body.LOF;

    // some tools might only have LOC or LOF defined. Set these equal so we don't have to deal with it later
    if (req.body.LOC === undefined) req.body.LOC = req.body.LOF;
    if (req.body.LOF === undefined) req.body.LOF = req.body.LOC;

    await getCenterData(req.body);

    // TODO: instead of storing the entire toolData var in the db, store only the request body. The toolData also includes things like executable path etc., which need to be retrieved from the custom_params table when the request gets passed over to the exe
    if (specCount !== 0) {
        const result = await prisma.specifications.create({
            data: {
                user_id: req.body.user_id,
                status: 'pending',
                data: req.body,
                name: req.body.specName,
                path: '',
                error: '',
                tool_id: parseInt(toolId),
                version_id: parseInt(process.env.VERSION_ID)
            }
        })
        return res.status(200).json(result)
    } else {
        const additionalSpecParameters = await getAdditionalSpecificationParameters(req.body, toolId !== 2);
        req.body.outputPath = additionalSpecParameters.OutputPath;
        const result = await prisma.specifications.create({
            data: {
                user_id: req.body.user_id,
                status: 'generating',
                data: req.body,
                name: req.body.specName,
                path: '',
                error: '',
                tool_id: parseInt(toolId),
                version_id: parseInt(process.env.VERSION_ID)
            }
        });
        req.body.ToolType = additionalSpecParameters.ToolTypeName;
        const specData = {
            ...additionalSpecParameters,
            ...req.body,
            PartFileName: `TOOL_V2_GENERATED_${result.specification_id}`,
            DrawingFileName: `DRAWING_V2_GENERATED_${result.specification_id}`,
            SpecificationNumber: result.specification_id
        };
        let parameterString = btoa(JSON.stringify(specData));
        childProcess = execFile(specData.ExecutablePath, [parameterString], (err, data) => {
            let canceled = false;
            if (err !== undefined && err !== null) canceled = err.killed;
            updateSpecificationStatus(result.specification_id, data, canceled);
            checkPendingSpecifications(result.specification_id);
        });
        return res.status(200).json(result)
    }
})

async function getCenterData(body) {
    const centerTypesOrStatement = [];
    if (body.Center.UpperType !== '' && body.Center.UpperType !== undefined) centerTypesOrStatement.push({
        center_type_id: parseInt(body.Center.UpperType)
    });
    if (body.Center.LowerType !== '' && body.Center.LowerType !== undefined) centerTypesOrStatement.push({
        center_type_id: parseInt(body.Center.LowerType)
    });

    let result;
    if (centerTypesOrStatement.length !== 0) {
        result = await prisma.center_types.findMany({
            where: {
                OR: centerTypesOrStatement
            }
        })
    }


    // TODO: implement boss diameter and length in db
    // TODO: actually implement tolerances
    if (body.Center.UpperCenterType !== '-1' && body.Center.UpperCenterType !== undefined) {
        const centerData = result.filter(e => e.center_type_id === parseInt(body.Center.UpperType))[0];
        body.Center.UpperCenter = true;
        body.Center.UpperCenterDimensions = {};
        body.Center.UpperCenterDimensions.A1Min = centerData.a1_lower;
        body.Center.UpperCenterDimensions.A1Max = centerData.a1_upper;
        body.Center.UpperCenterDimensions.A2Min = centerData.a2_lower;
        body.Center.UpperCenterDimensions.A2Max = centerData.a2_upper;
        body.Center.UpperCenterDimensions.D1Min = centerData.d1_lower;
        body.Center.UpperCenterDimensions.D1Max = centerData.d1_upper;
        body.Center.UpperCenterDimensions.D2Min = centerData.d2_lower;
        body.Center.UpperCenterDimensions.D2Max = centerData.d2_upper;
        body.Center.UpperCenterDimensions.LMin = centerData.l_lower;
        body.Center.UpperCenterDimensions.LMax = centerData.l_upper;
        body.Center.UpperCenterDimensions.BossDiameterMax = centerData.boss_diameter_upper;
        body.Center.UpperCenterDimensions.BossDiameterMin = centerData.boss_diameter_lower;
        body.Center.UpperCenterDimensions.BossLengthMax = centerData.boss_length_upper;
        body.Center.UpperCenterDimensions.BossLengthMin = centerData.boss_length_lower;
    } else {
        body.Center.UpperCenter = false;
        delete body.Center.UpperCenterDimensions;
    }

    if (body.Center.LowerCenterType !== '-1' && body.Center.LowerCenterType !== undefined) {
        const centerData = result.filter(e => e.center_type_id === parseInt(body.Center.LowerType))[0];
        body.Center.LowerCenter = true;
        body.Center.LowerCenterDimensions = {};
        body.Center.LowerCenterDimensions.A1Min = centerData.a1_lower;
        body.Center.LowerCenterDimensions.A1Max = centerData.a1_upper;
        body.Center.LowerCenterDimensions.A2Min = centerData.a2_lower;
        body.Center.LowerCenterDimensions.A2Max = centerData.a2_upper;
        body.Center.LowerCenterDimensions.D1Min = centerData.d1_lower;
        body.Center.LowerCenterDimensions.D1Max = centerData.d1_upper;
        body.Center.LowerCenterDimensions.D2Min = centerData.d2_lower;
        body.Center.LowerCenterDimensions.D2Max = centerData.d2_upper;
        body.Center.LowerCenterDimensions.LMin = centerData.l_lower;
        body.Center.LowerCenterDimensions.LMax = centerData.l_upper;
        body.Center.LowerCenterDimensions.BossDiameterMax = centerData.boss_diameter_upper;
        body.Center.LowerCenterDimensions.BossDiameterMin = centerData.boss_diameter_lower;
        body.Center.LowerCenterDimensions.BossLengthMax = centerData.boss_length_upper;
        body.Center.LowerCenterDimensions.BossLengthMin = centerData.boss_length_lower;
    } else {
        body.Center.LowerCenter = false;
        delete body.Center.LowerCenterDimensions;
    }

    return body;
}

async function updateSpecificationStatus(id, data, canceled) {
    const error = data.substring(0, 3) === "ERR" ? true : false;
    const status = canceled ? 'canceled' : error ? 'failed' : 'finished';

    await prisma.specifications.update({
        where: {
            specification_id: id
        },
        data: {
            status: status,
            error: error ? data : ""
        }
    });
}

function convertDbNameToParamName(input) {
    // postgres does not allow capitalization in column names, so we need to convert the db keys from this_format to ThisFormat for use in C#
    return input.split('_').map(e => e.charAt(0).toUpperCase() + e.substring(1)).join('');
}

async function getAdditionalSpecificationParameters(data, getSeriesData = true) {
    // both the tool series information (flute count, etc.) and custom parameters (master path, etc.) can change at any time, so look up these values when a specification is about to be generated
    let customParams, seriesData, toolData;

    if (getSeriesData) {
        [customParams, seriesData, toolData] = await prisma.$transaction([
            prisma.custom_params.findMany({
                where: {
                    title: {
                        in: ['MasterPath', 'ExecutablePath', 'ToolSeriesPath', 'DimensionPath', 'OutputPath']
                    }
                }
            }),
            prisma.series.findUnique({
                where: {
                    series_id: parseInt(data.ToolSeries)
                }
            }),
            prisma.tools.findUnique({
                where: {
                    tool_id: parseInt(data.ToolType)
                }
            })
        ])
    } else {
        [customParams, toolData] = await prisma.$transaction([
            prisma.custom_params.findMany({
                where: {
                    title: {
                        in: ['MasterPath', 'ExecutablePath', 'ToolSeriesPath', 'DimensionPath', 'OutputPath']
                    }
                }
            }),
            prisma.tools.findUnique({
                where: {
                    tool_id: parseInt(data.ToolType)
                }
            })
        ])
    }


    customParams = customParams.reduce((total, e) => {
        return {
            ...total,
            [e.title]: e.value
        }
    }, {})

    if (getSeriesData) {
        for (const [key, value] of Object.entries(seriesData)) {
            let newKey = convertDbNameToParamName(key);
            seriesData[newKey] = value;
            delete seriesData[key];
        }
    }

    let ShankType = 'Normal';
    if (data.ShankNeck) ShankType = 'Neck';
    else if (data.ShankDiameter > data.ToolDiameter) ShankType = 'Blend';
    else if (data.ShankDiameter < data.ToolDiameter) ShankType = 'Reduced';

    const computedToolParameters = {
        ShankType
    };

    let result = { ...customParams, ...computedToolParameters, ToolTypeName: toolData.name }
    return getSeriesData ? { ...result, ...seriesData } : result;
}

async function checkPendingSpecifications() {
    const specs = await prisma.specifications.findMany({
        where: {
            status: 'pending'
        }
    });

    if (specs.length === 0) return;
    const spec = specs[0];
    const specDbData = spec.data;
    const specDataExecutable = { ...specDbData };
    const additionalSpecParameters = await getAdditionalSpecificationParameters(specDbData, spec.tool_id !== 2);
    specDataExecutable.ToolType = additionalSpecParameters.ToolTypeName;
    specDbData.outputPath = additionalSpecParameters.OutputPath;
    const specData = {
        ...additionalSpecParameters,
        ...specDataExecutable,
        PartFileName: `TOOL_V2_GENERATED_${spec.specification_id}`,
        DrawingFileName: `DRAWING_V2_GENERATED_${spec.specification_id}`,
        SpecificationNumber: spec.specification_id
    };
    const parameterString = btoa(JSON.stringify(specData));
    const result = await prisma.specifications.updateMany({
        where: {
            specification_id: spec.specification_id
        },
        data: {
            status: 'generating',
            data: specDbData
        }
    })
    childProcess = execFile(specData.ExecutablePath, [parameterString], (err, data) => {
        let canceled = false;
        if (err !== undefined && err !== null) canceled = err.killed;
        updateSpecificationStatus(spec.specification_id, data, canceled);
        checkPendingSpecifications(spec.specification_id);
    });
}

// #endregion

// #region users

app.get('/users', async (req, res) => {
    const users = await prisma.users.findMany({
        where: {
            active: true
        }
    })

    res.json(users);
})

app.post('/users/new', async (req, res) => {
    const result = await prisma.users.create({
        data: {
            name: req.body.name,
            admin: false
        }
    });
    return res.status(201).json(result);
})

app.put('/users/:user_id', async (req, res) => {
    const result = await prisma.users.update({
        where: {
            user_id: parseInt(req.params.user_id)
        },
        data: {
            name: req.body.name
        }
    });
    return res.status(200).json(result);
})

app.delete('/users/:user_id', async (req, res) => {
    // doesn't actually delete, but deactivates so specs belonging to that user stay
    const [_, result] = await prisma.$transaction([
        prisma.users.update({
            where: {
                user_id: parseInt(req.params.user_id)
            },
            data: {
                active: false
            }
        }),
        prisma.users.findMany({
            where: {
                active: true
            }
        })
    ])

    res.status(200).json(result);
})

// #endregion

// #region custom_params

app.get('/custom_params', async (req, res) => {
    const result = await prisma.custom_params.findMany({});
    res.status(200).json(result);
})

app.put('/custom_params', async (req, res) => {
    let queries = [];
    for (const [key, value] of Object.entries(req.body)) {
        queries.push(
            prisma.custom_params.update({
                where: {
                    title: key
                },
                data: {
                    value: value
                }
            })
        )
    }
    const result = await prisma.$transaction(queries);
    return res.status(200).json(result);
})

// #endregion

// #region catalog

app.put('/catalog/:series_id/update', async (req, res) => {
    const [seriesPath, series] = await prisma.$transaction([
        prisma.custom_params.findUnique({
            where: {
                title: 'ToolSeriesPath'
            }
        }),
        prisma.series.findUnique({
            where: {
                series_id: parseInt(req.params.series_id)
            },
            include: {
                series_inputs: {
                    select: {
                        catalog_index: true,
                        name: true,
                        type: true,
                        value: true
                    },
                    orderBy: {
                        catalog_index: 'asc'
                    }
                }
            }
        })
    ]);

    const fullPath = path.join(seriesPath.value, series.tool_series_file_name);
    const newTools = loadTools(
        fullPath,
        series
    );

    const [_, newSeries, catalogTools] = await prisma.$transaction([
        prisma.catalog_tools.deleteMany({
            where: {
                series_id: parseInt(req.params.series_id)
            }
        }),
        prisma.series.update({
            where: {
                series_id: parseInt(req.params.series_id)
            },
            include: {
                _count: {
                    select: {
                        catalog_tools: true
                    }
                }
            },
            data: {
                catalog_updated: new Date()
            }
        }),
        prisma.catalog_tools.createMany({
            data: newTools
        })
    ])

    res.status(200).json({ series: newSeries, catalogTools });
})

app.get('/catalog', async (req, res) => {
    let { p, s } = req.query;
    let search = s !== '';
    let page = parseInt(p);
    const specsPerPage = 15;
    const [count, tools, version] = await prisma.$transaction([
        prisma.catalog_tools.count({
            where: {
                ...(search ? {
                    OR: [
                        {
                            tool_number: {
                                contains: s
                            }
                        },
                        {
                            series: {
                                name: {
                                    contains: s
                                }
                            }
                        }
                    ]
                } : {})
            }
        }),
        prisma.catalog_tools.findMany({
            where: {
                ...(search ? {
                    OR: [
                        {
                            tool_number: {
                                contains: s
                            }
                        },
                        {
                            series: {
                                name: {
                                    contains: s
                                }
                            }
                        }
                    ]
                } : {})
            },
            select: {
                catalog_tool_id: true,
                tool_number: true,
                series: {
                    select: {
                        name: true,
                        tools: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            take: specsPerPage,
            skip: specsPerPage * page,
            orderBy: {
                tool_number: 'asc'
            }
        })
    ])
    return res.status(200).json({ tools: tools, pages: Math.ceil(count / specsPerPage) });
})

app.get('/catalog/:catalog_tool_id', async (req, res) => {
    let tool = await prisma.catalog_tools.findUnique({
        where: {
            catalog_tool_id: parseInt(req.params.catalog_tool_id)
        }
    });

    const inputs = await prisma.tool_inputs.findMany({
        where: {
            tools: {
                series: {
                    some: {
                        series_id: parseInt(tool.series_id)
                    }
                }
            },
            property_name: {
                in: Object.keys(tool.data)
            }
        }
    });

    tool = convertCatalogMetricUnits(tool);

    for (let i = 0; i < inputs.length; i++) {
        const propertyName = inputs[i].property_name;
        const clientName = inputs[i].client_name;

        const oldToolEntryValue = tool.data[propertyName];
        delete tool.data[propertyName];
        tool.data[clientName] = oldToolEntryValue;

        if (tool.convertedData !== undefined) {
            if (tool.convertedData[propertyName] !== undefined) {
                const oldToolEntryValue = tool.convertedData[propertyName];
                delete tool.convertedData[propertyName];
                tool.convertedData[clientName] = oldToolEntryValue;
            }
        }
    }

    return res.status(200).json(tool);
})

app.get('/catalog/:catalog_tool_id/copy', async (req, res) => {
    let tool = await prisma.catalog_tools.findUnique({
        where: {
            catalog_tool_id: parseInt(req.params.catalog_tool_id)
        },
        include: {
            series: {
                include: {
                    tools: true,
                    series_inputs: {
                        where: {
                            type: 'toggle'
                        }
                    }
                }
            }
        }
    });

    let data = convertCatalogToolFormatting(tool);
    let toolDataProperties = [];
    for (const [key, value] of Object.entries(data)) toolDataProperties.push(key);

    let defaultValues = await prisma.default_input_values.findMany({
        where: {
            tool_inputs: {
                tool_id: parseInt(tool.series.tool_id),
                property_name: {
                    notIn: toolDataProperties
                }
            }
        },
        include: {
            tool_inputs: {
                select: {
                    type: true,
                    property_name: true
                }
            }
        }
    })
    return res.json({ data, defaultValues })
})

// #endregion

// #region centers

app.get('/centers', async (req, res) => {
    let result;
    if (req.query.nameOnly === 'true') {
        result = await prisma.center_types.findMany({
            select: {
                name: true,
                center_type_id: true
            },
            orderBy: {
                name: 'asc'
            }
        });
    } else {
        result = await prisma.center_types.findMany({
            orderBy: {
                name: 'asc'
            }
        });
    }
    res.status(200).json(result);
})

app.put('/centers/:center_type_id', async (req, res) => {
    const centerTypeId = req.params.center_type_id;
    if (centerTypeId === null || centerTypeId === undefined || centerTypeId === '') return res.sendStatus(400);

    const result = await prisma.center_types.update({
        where: {
            center_type_id: parseInt(centerTypeId)
        },
        data: formatCenterTypeData(req.body)
    });

    res.status(200).json(result);
});

app.post('/centers', async (req, res) => {
    const result = await prisma.center_types.create({
        data: formatCenterTypeData(req.body)
    });

    res.status(201).json(result);
});

app.delete('/centers/:center_type_id', async (req, res) => {
    const result = await prisma.center_types.delete({
        where: {
            center_type_id: parseInt(req.params.center_type_id)
        }
    });

    res.status(200).json(result);
})

function formatCenterTypeData(input) {
    let output = {};
    for (const [key, value] of Object.entries(input)) {
        let keySegments = key.split('_');
        toleranceElement = keySegments.pop();
        if (toleranceElement === 'tolerance') {
            // tolerance entry
            dimensionName = keySegments.join('_');
            output[`${dimensionName}_upper`] = parseFloat(input[`${dimensionName}_upper`]);
            if (value === true) {
                output[`${dimensionName}_lower`] = parseFloat(input[`${dimensionName}_lower`]);
            } else {
                output[`${dimensionName}_lower`] = parseFloat(input[`${dimensionName}_upper`]);
            }
        }
    }
    output.name = input.name;
    return output;
}

// #endregion

app.post('/reports/new', async (req, res) => {
    // still store issue in own db just in case github token is expired
    const result = await prisma.reports.create({
        data: {
            summary: req.body.summary,
            description: req.body.description,
            specification_id: parseInt(req.body.specification_id),
            user_id: parseInt(req.body.user_id)
        }
    })

    const title = `user_id: ${req.body.user_id}; specification_id: ${req.body.specification_id}. ${req.body.summary}`;
    await fetch(
        `https://api.github.com/repos/tedvanwijk/maford-issues/issues`,
        {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.ISSUE_TOKEN}`
            },
            body: JSON.stringify({
                owner: 'tedvanwijk',
                repo: 'maford-client',
                title: title,
                body: req.body.description,
                assignee: null,
                milestone: null,
                labels: ['user_issue']
            })
        }
    )

    // TOOD: error handling (especially if github token is expired)
    return res.sendStatus(204);
})

app.get('/versions', async (req, res) => {
    const result = await prisma.version_history.findMany({
        orderBy: {
            version_id: 'desc'
        }
    });
    return res.json(result);
})

app.get('/status', async (req, res) => {
    return res.sendStatus(parseInt(process.env.STATUS));
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})