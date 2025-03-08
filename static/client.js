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
    AnnotationHoverModifier,
    TextAnnotation
} = SciChart;

const initSciChart = async (points) => {
    const { wasmContext, sciChartSurface } = await SciChartSurface.create("scichart-root", {
        theme: new SciChartJsNavyTheme()
    });

    // Add the axes to the SciChart surface
    sciChartSurface.xAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 1" }));
    sciChartSurface.yAxes.add(new NumericAxis(wasmContext, { axisTitle: "PCA Component 2" }));

    // Ensure points are valid and contain x, y, pmid
    if (!points || points.length === 0) {
        console.error("Invalid points data");
        return;
    }

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

    sciChartSurface.renderableSeries.add(scatterSeries);

    // Add chart modifiers to enable zoom and pan functionality
    sciChartSurface.chartModifiers.add(
        new MouseWheelZoomModifier(),
        new ZoomPanModifier(),
        new ZoomExtentsModifier()
    );

    // Create a hover annotation
    let tooltipAnnotation = new TextAnnotation(wasmContext, {
        x1: 0, y1: 0, x2: 0, y2: 0, // Place it off-screen initially
        fontSize: 14,
        fill: "black",
        background: "white",
        padding: 5,
        text: "",
        isVisible: false
    });

    sciChartSurface.annotations.add(tooltipAnnotation);

    // Use AnnotationHoverModifier to detect hover
    const annotationHoverModifier = new AnnotationHoverModifier({
        enableHover: true,
        onHover: (args) => {
            const { mouseArgs, hoveredEntities } = args;

            if (hoveredEntities.length > 0) {
                const hoveredPoint = hoveredEntities[0];
                const index = hoveredPoint.index; // Get the index of the hovered point
                console.log(index);

                if (index < 0 || index >= points.length) {
                    console.error("Invalid point index:", index);
                    return;
                }

                const pmid = points[index].pmid; // Assuming points contain the pmid
                const relativeX = mouseArgs.mousePoint.x;
                const relativeY = mouseArgs.mousePoint.y;

                // Update tooltip position and text
                tooltipAnnotation.text = `PMID: ${pmid}`;
                tooltipAnnotation.x1 = relativeX + 10; // Position it next to the hovered point
                tooltipAnnotation.y1 = relativeY + 10;
                tooltipAnnotation.isVisible = true; // Show tooltip
            } else {
                tooltipAnnotation.isVisible = false; // Hide tooltip when not hovering over a point
            }
        }
    });

    sciChartSurface.chartModifiers.add(annotationHoverModifier);
};

document.getElementById("submit-btn").addEventListener("click", async () => {
    const submitButton = document.getElementById("submit-btn");
    const pmids = document.getElementById("pmids").value;
    if (!pmids.trim()) return;

    let pmidList = pmids.split(/\s|,/)
        .map(pmid => pmid.trim())
        .filter(pmid => pmid !== "" && !isNaN(pmid));

    // Disable button and show loading animation
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
            document.getElementById("scichart-root").innerHTML = ""; // Clear existing chart
            initSciChart(result); // Initialize new chart with result data
        } else {
            console.error("Invalid result:", result);
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    } finally {
        // Re-enable the button and reset the text after the request
        submitButton.disabled = false;
        submitButton.classList.remove("loading");
        submitButton.textContent = "Run";
    }
});
