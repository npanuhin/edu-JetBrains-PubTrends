const {
    SciChartSurface,
    NumericAxis,
    XyDataSeries,
    XyScatterRenderableSeries,
    EllipsePointMarker,
    SciChartJsNavyTheme,
    MouseWheelZoomModifier,
    ZoomPanModifier,
    ZoomExtentsModifier
} = SciChart;

const initSciChart = async (points) => {
    const { wasmContext, sciChartSurface } = await SciChartSurface.create("scichart-root", {
        theme: new SciChartJsNavyTheme()
    });

    // Add the axes to the SciChart surface
    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 1" }));
    sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 2" }));

    // Create XyDataSeries with the data points
    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);

    const xyDataSeries = new XyDataSeries(wasmContext, {
        xValues,
        yValues,
    });

    // Create ScatterSeries with a point marker (Ellipse) for each data point
    const scatterSeries = new XyScatterRenderableSeries(wasmContext, {
        dataSeries: xyDataSeries,
        pointMarker: new EllipsePointMarker(wasmContext, {
            width: 10,
            height: 10,
            strokeThickness: 2,
            fill: "steelblue",
            stroke: "LightSteelBlue",
        }),
    });

    // Add the scatter series to the renderable series collection
    sciChartSurface.renderableSeries.add(scatterSeries);

    // Add chart modifiers to enable zoom and pan functionality
    sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier()
    );
};

document.getElementById("submit-btn").addEventListener("click", async () => {
    const pmids = document.getElementById("pmids").value;
    if (!pmids.trim()) return;

    let pmidList = pmids.split(/\s|,/)
        .map(pmid => pmid.trim())
        .filter(pmid => pmid !== "" && !isNaN(pmid));

    const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pmids: pmidList.join(",") })
    });

    const result = await response.json();
    console.log(result);
    if (result) {
        document.getElementById("scichart-root").innerHTML = ""; // Clear existing chart
        initSciChart(result); // Initialize new chart with result data
    }
});
