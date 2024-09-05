const xlsx = require('xlsx');

function loadTools(path, seriesInfo) {
    const headers = seriesInfo.series_inputs.map(e => e.name);
    headers.unshift('_tool');

    let wb = xlsx.readFile(path, {sheets: 'CATALOG'});
    let sheet = xlsx.utils.sheet_to_json(wb.Sheets.CATALOG, {
        header: headers,
        defval: '',
        blankrows: false // skip blank rows
    });

    let startFound = false;
    let newTools = [];
    for (let i = 0; i < sheet.length; i++) {
        const row = sheet[i];
        if (!startFound) {
            if (row._tool !== undefined && row._tool !== null && row._tool !== '') startFound = true;
            continue;
        }

        let newTool = {
            tool_number: row._tool,
            data: row,
            series_id: seriesInfo.series_id
        }
        newTools.push(newTool);
    }

    return newTools;
}

function convertCatalogToolFormatting(catalogData) {
    const catalogToolData = catalogData.data;
    let toolData = {...catalogToolData};
    toolData.ToolType = catalogData.series.tools.tool_id;
    toolData.ToolSeries = catalogData.series.series_id;
    toolData.PartNumber = catalogData.tool_number;

    // EM corner style checking
    if (catalogToolData.CornerRadius !== undefined) {
        if (catalogToolData.CornerRadius > 0) toolData.CornerStyle = 'Corner Radius';
    }

    // toggle inputs checking
    for (let i = 0; i < catalogData.series.series_inputs.length; i++) {
        const seriesInput = catalogData.series.series_inputs[i];
        const catalogInputValue = catalogToolData[seriesInput.name];
        if (catalogInputValue === undefined) {
            toolData[seriesInput.name] = false;
            continue;
        }
        toolData[seriesInput.name] = seriesInput.value === catalogInputValue;
    }

    return toolData;
    // return catalogData;
}

module.exports = {loadTools, convertCatalogToolFormatting}