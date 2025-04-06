const {
    SciChartSurface,
    NumericAxis,
    XyDataSeries,
    XyScatterRenderableSeries,
    EllipsePointMarker,
    SciChartJsNavyTheme,
    MouseWheelZoomModifier,
    ZoomPanModifier,
    ZoomExtentsModifier,
} = SciChart;

const initSciChart = async (points) => {
    const { wasmContext, sciChartSurface } = await SciChartSurface.create("scichart-root", {
        theme: new SciChartJsNavyTheme()
    });

    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 1" }));
    sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 2" }));

    if (!points || points.length === 0) {
        console.error("Invalid points data");
        return;
    }

    const xValues = points.map(p => p.x);
    const yValues = points.map(p => p.y);

    const xyDataSeries = new XyDataSeries(wasmContext, {
        xValues,
        yValues,
    });

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

    sciChartSurface.renderableSeries.add(scatterSeries);

    sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier()
    );
};

document.getElementById("submit-btn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submit-btn");
    const pmids = document.getElementById("pmids").value;
    if (!pmids.trim()) return;

    let pmidList = pmids.split(/\s|,/)
        .map(pmid => pmid.trim())
        .filter(pmid => pmid !== "" && !isNaN(pmid));

    submitButton.disabled = true;
    submitButton.classList.add("loading");
    submitButton.textContent = "Loading...";

    try {
        const response = await fetch("http://localhost:5000/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pmids: pmidList.join(",") })
        });

        const result = await response.json();

        if (result && Array.isArray(result)) {
            document.getElementById("scichart-root").innerHTML = "";
            initSciChart(result);
        } else {
            console.error("Invalid result:", result);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
        submitButton.textContent = "Run";
    }
});
