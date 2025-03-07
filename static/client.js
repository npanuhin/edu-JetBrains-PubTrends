const {
    SciChartSurface,
    NumericAxis,
    FastLineRenderableSeries,
    XyDataSeries,
    EllipsePointMarker,
    SweepAnimation,
    SciChartJsNavyTheme,
    NumberRange,
    MouseWheelZoomModifier,
    ZoomPanModifier,
    ZoomExtentsModifier
} = SciChart;

const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root", {
        theme: new SciChartJsNavyTheme(),
        title: "SciChart.js First Chart",
        titleStyle: { fontSize: 22 }
    });

    const growBy = new NumberRange(0.1, 0.1);
    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "X Axis", growBy }));
    sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: "Y Axis", growBy }));

    sciChartSurface.renderableSeries.add(new FastLineRenderableSeries(wasmContext, {
        stroke: "steelblue",
        strokeThickness: 3,
        dataSeries: new XyDataSeries(wasmContext, {
            xValues: [0,1,2,3,4,5,6,7,8,9],
            yValues: [0, 0.0998, 0.1986, 0.2955, 0.3894, 0.4794, 0.5646, 0.6442, 0.7173, 0.7833]
        }),
        pointMarker: new EllipsePointMarker(wasmContext, { width: 11, height: 11, fill: "#fff" }),
        animation: new SweepAnimation({ duration: 300, fadeEffect: true })
    }));

    sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier()
    );
};

initSciChart();

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
    if (result.imageUrl) {
        const img = document.createElement("img");
        img.src = result.imageUrl;
        img.style.width = "100%";
        document.getElementById("scichart-root").innerHTML = "";
        document.getElementById("scichart-root").appendChild(img);
    }
});
