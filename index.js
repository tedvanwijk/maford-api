const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(bodyParser.json())
const corsOptions = {
    origin: 'http://localhost:3000'
}
app.use(cors(corsOptions));

const port = 5000;

const { execFile, spawn } = require('child_process');

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
        }
    })
    return res.json(result);
})

app.post('/series/new', async (req, res) => {
    const result = await prisma.series.create({
        data: {
            
        }
    })
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

app.get('/tool/:tool_id/inputs', async (req, res) => {

    let toolInputs, toolCategories, toolInputRules, commonToolInputs;
    if (req.query.name === 'true') {
        [toolInputs, toolCategories, toolInputRules, commonToolInputs] = await prisma.$transaction([
            prisma.tool_inputs.findMany({
                where: {
                    tools: {
                        name: req.params.tool_id
                    }
                },
                orderBy: [
                    {
                        group: 'asc'
                    },
                    {
                        order: 'asc'
                    }
                ]
            }),
            prisma.tool_input_categories.findMany({
                where: {
                    tools: {
                        name: req.params.tool_id
                    }
                }
            }),
            prisma.tool_input_rules.findMany({
                where: {
                    tool_inputs: {
                        tools: {
                            name: req.params.tool_id
                        }
                    }
                }
            }),
            prisma.tool_inputs_common.findMany()
        ]);
    } else {
        [toolInputs, toolCategories, toolInputRules, commonToolInputs] = await prisma.$transaction([
            prisma.tool_inputs.findMany({
                where: {
                    tool_id: parseInt(req.params.tool_id)
                },
                orderBy: [
                    {
                        group: 'asc'
                    },
                    {
                        order: 'asc'
                    }
                ]
            }),
            prisma.tool_input_categories.findMany({
                where: {
                    tool_id: parseInt(req.params.tool_id)
                }
            }),
            prisma.tool_input_rules.findMany({
                where: {
                    tool_inputs: {
                        tool_id: parseInt(req.params.tool_id)
                    }
                }
            }),
            prisma.tool_inputs_common.findMany()
        ]);
    }



    return res.status(200).json({ toolCategories, toolInputs, toolInputRules, commonToolInputs });
})

// #endregion

// #region specifications

app.get('/specifications', async (req, res) => {
    let { page } = req.query;
    page = parseInt(page);
    const specsPerPage = 15;
    const [count, specs] = await prisma.$transaction([
        prisma.specifications.count(),
        prisma.specifications.findMany({
            select: {
                specification_id: true,
                users: true,
                status: true,
                name: true
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
        }
    })
    res.status(200).json(spec);
})

app.post('/specifications/new/test', async (req, res) => {
    console.log(req.body);
    const params = await getAdditionalSpecificationParameters(req.body);
    res.json(params);
})

app.post('/specifications/new', async (req, res) => {
    const specCount = await prisma.specifications.count({
        where: {
            status: {
                in: ['pending', 'generating']
            }
        }
    });

    // TODO: instead of storing the entire toolData var in the db, store only the request body. The toolData also includes things like executable path etc., which need to be retrieved from the custom_params table when the request gets passed over to the exe
    if (specCount !== 0) {
        const result = await prisma.specifications.create({
            data: {
                user_id: req.body.user_id,
                status: 'pending',
                data: JSON.stringify(req.body),
                name: req.body.specName,
                path: '',
                error: ''
            }
        })
        return res.status(200).json(result)
    } else {
        const result = await prisma.specifications.create({
            data: {
                user_id: req.body.user_id,
                status: 'generating',
                data: JSON.stringify(req.body),
                name: req.body.specName,
                path: '',
                error: ''
            }
        });
        const additionalSpecParameters = await getAdditionalSpecificationParameters(req.body);
        req.body.ToolType = additionalSpecParameters.ToolTypeName;
        const specData = {
            ...additionalSpecParameters,
            ...req.body,
            PartFileName: `TOOL_V2_GENERATED_${result.specification_id}`,
            DrawingFileName: `DRAWING_V2_GENERATED_${result.specification_id}`,
            SpecificationNumber: result.specification_id
        };
        let parameterString = btoa(JSON.stringify(specData));
        execFile(specData.ExecutablePath, [parameterString], (err, data) => {
            updateSpecificationStatus(result.specification_id, data);
            checkPendingSpecifications(result.specification_id);
        });
        return res.status(200).json(result)
    }
})

async function updateSpecificationStatus(id, data) {
    const error = data.substring(0, 3) === "ERR" ? true : false;
    await prisma.specifications.update({
        where: {
            specification_id: id
        },
        data: {
            status: error ? "failed" : "finished",
            error: error ? data : ""
        }
    });
}

function convertDbNameToParamName(input) {
    // postgres does not allow capitalization in column names, so we need to convert the db keys from this_format to ThisFormat for use in C#
    return input.split('_').map(e => e.charAt(0).toUpperCase() + e.substring(1)).join('');
}

async function getAdditionalSpecificationParameters(data) {
    console.log(data)
    // both the tool series information (flute count, etc.) and custom parameters (master path, etc.) can change at any time, so look up these values when a specification is about to be generated
    let [customParams, seriesData, toolData] = await prisma.$transaction([
        prisma.custom_params.findMany({
            where: {
                title: {
                    in: ['MasterPath', 'ExecutablePath', 'ToolSeriesPath', 'DimensionFileName', 'ToleranceFileName']
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

    customParams = customParams.reduce((total, e) => {
        return {
            ...total,
            [e.title]: e.value
        }
    }, {})

    for (const [key, value] of Object.entries(seriesData)) {
        let newKey = convertDbNameToParamName(key);
        seriesData[newKey] = value;
        delete seriesData[key];
    }

    let ShankType = 'Normal';
    if (data.ShankNeck) ShankType = 'Neck';
    else if (data.ShankDiameter > data.ToolDiameter) ShankType = 'Blend';
    else if (data.ShankDiameter < data.ToolDiameter) ShankType = 'Reduced';

    const computedToolParameters = {
        ShankType
    };

    return { ...customParams, ...seriesData, ...computedToolParameters, ToolTypeName: toolData.name };
}

async function checkPendingSpecifications() {
    const specs = await prisma.specifications.findMany({
        where: {
            status: 'pending'
        }
    });

    if (specs.length === 0) return;
    const spec = specs[0];
    const specDbData = JSON.parse(spec.data);
    const additionalSpecParameters = await getAdditionalSpecificationParameters(specDbData);
    specDbData.ToolType = additionalSpecParameters.ToolTypeName;
    const specData = {
        ...additionalSpecParameters,
        ...specDbData,
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
            status: 'generating'
        }
    })
    execFile(specData.ExecutablePath, [parameterString], (err, data) => {
        updateSpecificationStatus(spec.specification_id, data);
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

// #endregion

app.post('/reports/new', async (req, res) => {
    const result = await prisma.reports.create({
        data: {
            summary: req.body.summary,
            description: req.body.description,
            specification_id: parseInt(req.body.specification_id),
            user_id: req.body.user_id
        }
    })
    return res.sendStatus(204);
})

app.get('/versions', async (req, res) => {
    const result = await prisma.version_history.findMany({});
    return res.json(result);
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})