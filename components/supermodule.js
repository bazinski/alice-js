class SuperModuleComponent extends ComponentBase {
    constructor(id, width, height, viewBox, config) {
        super(id, width, height, marginDef(5, 5, 5, 5), viewBox);

        const sectorToRotationAngle = this.sectorToRotationAngle;

        const layerData = this.layerData = getDimensions().filter(d => d.stack == 2);
        this.detectorData = d3.range(18)
            .map(s => layerData.map(l => Object.assign({ sector: s, rot: sectorToRotationAngle(s) }, l)))
            .reduce((a, b) => a.concat(b));

        this.config = config != null ? config : {};
        this.r = (this.config.r != null) ? this.config.r : 2;

        const xscale = this.xscale, yscale = this.yscale;
        xscale.domain([-450, 450]);
        yscale.domain([-450, 450]);

        this.line = d3.line().x(d => xscale(d.x)).y(d => yscale(-d.y));

        const zoom = d3.zoom()
            .scaleExtent([1, 40])
            .translateExtent([[-this.displayWidth / 2, -this.displayHeight / 2], [this.displayWidth / 2, this.displayHeight / 2]])
            .extent([[-this.displayWidth / 2, -this.displayHeight / 2], [this.displayWidth / 2, this.displayHeight / 2]])
            .on("zoom", this.zoomed.bind(this));

        this.container.append("rect")
            .attr("class", "zoom")
            .attr("width", this.displayWidth)
            .attr("height", this.displayHeight)
            .attr("transform", "translate(" + (-this.displayWidth / 2) + "," + (-this.displayHeight / 2) + ")")
            .call(zoom);

        this.rotatingContainer = this.container
            .classed("supermodule-component", true)
            .append("g")
            .attr("class", "rotating")
            ;

        this.detectors = this.rotatingContainer
            .append("g")
            .attr("class", "detectors")
            .selectAll("g.detector")
            .data(this.detectorData)
            .enter()
            .append("g")
            .attr("class", "detector")
            .attr("transform", d => "rotate(" + d.rot + ")translate(" + xscale(d.minR) + ",0)");

        this.detectors
            .append("rect")
            .attr("class", "detector")
            .attr("y", d => yscale(d.minLocalY))
            .attr("height", d => dist(d.minLocalY, d.maxLocalY, yscale))
            .attr("width", d => dist(d.minR, d.maxR, xscale));

        this.sectorNumbers = this.rotatingContainer
            .append("g")
            .attr("class", "sector-number")
            .selectAll("g")
            .data(d3.range(18))
            .enter()
            .append("g")
            .attr("transform", d => "rotate(" + sectorToRotationAngle(d) + ")translate(" + (xscale(d3.max(layerData, d2 => d2.maxR) * 1.1)) + ", 0)")
            .append("text")
            .attr("class", "sector-number")
            .text(d => d)
            .attr("transform", d => "rotate(" + (-sectorToRotationAngle(d)) + ")")
            ;

        this.tracklets = this.rotatingContainer.append("g")
            .attr("class", "tracklets");

        this.tracks = this.rotatingContainer.append("g")
            .attr("class", "tracks");

        //super.draw();
    }

    zoomed() {
        console.log(d3.event.transform)
    }

    sectorToRotationAngle(sector) {
        return -10 - 20 * sector;
    }

    draw(eventData) {
        const xscale = this.xscale, yscale = this.yscale;
        const line = this.line;
        const layerData = this.layerData;

        const selectedTrack = eventData.trdTrack != null ? eventData.trdTrack.id : null;

        let tracks = this.tracks
            .selectAll("g.track")
            .data(eventData.event.trdTracks.filter(d => d.track != null && d.track.path != null), d => d.id);

        tracks.exit().remove();

        tracks.enter()
            .append("g")
            .attr("class", "track")
            .append("path")
            .attr("class", "track")
            .attr("d", d => line(d.track.path));

        this.tracks.selectAll("path.track")
            .classed("selected", d => d.id == selectedTrack);

        const sectorToRotationAngle = this.sectorToRotationAngle;

        if (eventData.trdTrack != null && eventData.trdTrack.trdTracklets != null) {
            let tracklets = this.tracklets
                .selectAll(".tracklet")
                .data(eventData.trdTrack.trdTracklets, d => d.id);

            tracklets.exit().remove();

            tracklets.enter()
                .append("g")
                .attr("transform", d => "rotate(" + (sectorToRotationAngle(d.sector)) + ")")
                .append("circle")
                .attr("class", "tracklet")
                .attr("cy", d => yscale(-d.localY))
                .attr("cx", d => xscale((layerData[d.layer].maxR + layerData[d.layer].maxR) / 2))
                .attr("r", this.r);

            const sector = eventData.trdTrack.sector;

            if (this.config.rotate) {
                this.rotatingContainer
                    .transition()
                    .attr("transform", "rotate(" + ((sector - 4) * 20) + ")");

                this.sectorNumbers
                    .transition()
                    .attr("transform", d => "rotate(" + (-sectorToRotationAngle(d) - ((sector - 4) * 20)) + ")");
            }

            this.detectors.classed("not-selected", d => d.sector != sector);
        }
        else {
            if (this.config.rotate) {
                this.rotatingContainer
                    .transition()
                    .attr("transform", "rotate(0)");

                this.sectorNumbers
                    .transition()
                    .attr("transform", d => "rotate(" + (-sectorToRotationAngle(d)) + ")");
            }

            this.tracklets
                .selectAll(".tracklet")
                .remove();

            this.detectors.classed("not-selected", false);
        }
    }
}

// -60 -270 120 120