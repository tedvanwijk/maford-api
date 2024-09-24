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

    // metric checking (do at end)
    let metricParameter = toolData.Unit;
    if (metricParameter === undefined) return toolData;

    metricParameter = metricParameter.trim().toLowerCase();
    const isMetric = metricParameter === 'm';
    if (!isMetric) return toolData;
    // metric units in sheet are:
    // CR, LOA, LOC/LOF
    if (toolData.CornerRadius) toolData.CornerRadius = convertToInches(toolData.CornerRadius);
    if (toolData.LOA) toolData.LOA = convertToInches(toolData.LOA);
    if (toolData.LOF) toolData.LOF = convertToInches(toolData.LOF);
    if (toolData.LOC) toolData.LOC = convertToInches(toolData.LOC);
    return toolData;
}

function convertCatalogMetricUnits(catalogData) {
        // metric checking (do at end)
        let metricParameter = catalogData.data.Unit;
        if (metricParameter === undefined) return catalogData;
    
        metricParameter = metricParameter.trim().toLowerCase();
        const isMetric = metricParameter === 'm';
        if (!isMetric) return catalogData;
        // metric units in sheet are:
        // CR, LOA, LOC/LOF
        catalogData.convertedData = {};
        if (catalogData.data.CornerRadius) catalogData.convertedData.CornerRadius = convertToInches(catalogData.data.CornerRadius);
        if (catalogData.data.LOA) catalogData.convertedData.LOA = convertToInches(catalogData.data.LOA);
        if (catalogData.data.LOF) catalogData.convertedData.LOF = convertToInches(catalogData.data.LOF);
        if (catalogData.data.LOC) catalogData.convertedData.LOC = convertToInches(catalogData.data.LOC);
        return catalogData;
}

function convertToInches(value) {
    return Math.round((value / 25.4 + Number.EPSILON) * 100000) / 100000;
}
module.exports = {loadTools, convertCatalogToolFormatting, convertCatalogMetricUnits}