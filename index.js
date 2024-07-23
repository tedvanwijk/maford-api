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

app.put('/series/:series_id', async (req, res) => {
    let updatedSeriesData = {};
    let updatedInputData = Array(req.body.seriesInputLength).fill(0).map(() => ({}));
    // first loop filters out non-input series data and puts the series input data into an ordered array so all values for 1 row are in a single object
    for (let [key, value] of Object.entries(req.body)) {
        // console.log(key, value);
        let seriesInputArray = key.split('__');
        if (seriesInputArray.length === 1) {
            // if the lenght of this array is 1, it is not a series input but just a series column
            if (!isNaN(value)) value = parseFloat(value);
            updatedSeriesData[key] = value;
            continue;
        }
        updatedInputData[parseInt(seriesInputArray[0])][seriesInputArray[1]] = value;
    }

    let seriesInputQueries = [];
    // second loop turns each array entry (which is an object containing name etc.) into a prisma query
    for (let i = 0; i < req.body.seriesInputLength; i++) {
        seriesInputQueries.push(
            prisma.series_inputs.upsert({
                where: {
                    seriesIdIndex: {
                        index: i,
                        series_id: parseInt(req.params.series_id)
                    }
                },
                update: updatedInputData[i],
                create: {
                    ...updatedInputData[i],
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
            data: updatedSeriesData
        }),
        ...seriesInputQueries
    ])

    res.status(200).json(result[0]);
})

app.post('/series/:tool_id/new', async (req, res) => {
    let updatedSeriesData = {};
    let updatedInputData = Array(req.body.seriesInputLength).fill(0).map(() => ({}));
    // first loop filters out non-input series data and puts the series input data into an ordered array so all values for 1 row are in a single object
    for (let [key, value] of Object.entries(req.body)) {
        // console.log(key, value);
        let seriesInputArray = key.split('__');
        if (seriesInputArray.length === 1) {
            // if the lenght of this array is 1, it is not a series input but just a series column
            if (!isNaN(value)) value = parseFloat(value);
            updatedSeriesData[key] = value;
            continue;
        }
        updatedInputData[parseInt(seriesInputArray[0])][seriesInputArray[1]] = value;
    }

    updatedInputData.forEach((e, i) => { e.index = i });

    delete updatedSeriesData.seriesInputLength;
    const result = await prisma.series.create({
        data: {
            ...updatedSeriesData,
            tool_id: parseInt(req.params.tool_id),
            series_inputs: {
                create: updatedInputData
            }
        }
    });

    return res.status(201).json(result);
})

app.get('/series/tool_id/:tool_id', async (req, res) => {
    const result = await prisma.series.findMany({
        where: {
            tool_id: parseInt(req.params.tool_id)
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
    let { p, u, s } = req.query;
    let filterUser = !(u === 'null' || u === null | u === -1);
    let search = s !== '';
    let page = parseInt(p);
    const specsPerPage = 15;
    const [count, specs] = await prisma.$transaction([
        prisma.specifications.count({
            where: {
                ...(filterUser ? { user_id: parseInt(u) } : {}),
                ...(search ? {name: {contains: s}} : {})
            }
        }),
        prisma.specifications.findMany({
            where: {
                ...(filterUser ? { user_id: parseInt(u) } : {}),
                ...(search ? {name: {contains: s}} : {})
            },
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
        const additionalSpecParameters = await getAdditionalSpecificationParameters(req.body);
        req.body.outputPath = additionalSpecParameters.OutputPath;
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
    // console.log(data)
    // both the tool series information (flute count, etc.) and custom parameters (master path, etc.) can change at any time, so look up these values when a specification is about to be generated
    let [customParams, seriesData, toolData] = await prisma.$transaction([
        prisma.custom_params.findMany({
            where: {
                title: {
                    in: ['MasterPath', 'ExecutablePath', 'ToolSeriesPath', 'DimensionFileName', 'ToleranceFileName', 'OutputPath']
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
    const specDataExecutable = { ...specDbData };
    const additionalSpecParameters = await getAdditionalSpecificationParameters(specDbData);
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
            data: JSON.stringify(specDbData)
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

app.post('/users/new', async (req, res) => {
    const result = await prisma.users.create({
        data: {
            name: req.body.name,
            admin: false
        }
    });
    return res.status(201).json(result);
})

// #endregion

// #region custom_params

app.get('/custom_params', async (req, res) => {
    const result = await prisma.custom_params.findMany({});
    res.status(200).json(result);
})

app.put('/custom_params', async (req, res) => {
    let queries = [];
    for (let i = 0; i < req.body; i++) {
        queries.push(
            prisma.custom_params.update({
                where: {
                    title: req.body[i].title
                },
                data: {
                    value: req.body[i].title
                }
            })
        )
    }
    const result = await prisma.$transaction(queries);
    return res.status(200).json(result);
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
    const result = await prisma.version_history.findMany({
        orderBy: {
            version_id: 'desc'
        }
    });
    return res.json(result);
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})