/**
 * Custom chart for KKB to display stacked bar chart with percents and additional data
 */
(function() {
    'use strict';

    function BarChartPercentFact(BaseChart, Utils) {

        function BarChartPercent($scope) {
            BaseChart.apply(this, [$scope]);
            var _this            = this;
            _this.oldParseData   = this.parseData;
            _this.parseData      = parseData;
            _this.basePointClick = $scope.chartConfig.options.plotOptions.series.point.events.click;
            _this.noPlanCats     = []; // Stores categories that have no planed value. Used to make it red

            this.setType('bar');
            this.enableStacking();
            var ex = {
                options: {
                    chart: {
                        events: {
                            redraw: onRedraw
                        }
                    },
                    legend: {
                        reversed: true
                    },
                    tooltip: {
                        useHTML: true,
                        formatter: customFormatter
                    },
                    plotOptions: {
                        series: {
                            point: {
                                events: {
                                    click: onPointClick
                                }
                            }
                        }
                    }
                },
                xAxis: {
                    labels: {
                        formatter: formatXAxis
                    }
                },
                yAxis: {
                    minRange: 1,
                    plotLines: [{
                        color: 'red',
                        value: 1,
                        width: 2,
                        zIndex: 3
                    }],
                    labels: {
                        formatter: formatYAxis
                    }
                }
            };

            Utils.merge($scope.chartConfig, ex);

            /**
             * Used to format Y axis labels
             * @returns {string} Formatted label text
             */
            function formatYAxis() {
                /* jshint ignore:start */
                var t = this;
                /* jshint ignore:end */
                if (t.value === 1) {
                    return '<span style="font-size: 110%;font-weight:bold;color: red">100%</span>';
                }
                return parseFloat(t.value * 100).toFixed(0) + "%";
            }

            /**
             * Used to format X axis labels
             * @returns {string} Formatted label text
             */
            function formatXAxis() {
                /* jshint ignore:start */
                var t = this;
                /* jshint ignore:end */
                if (t.value === "ИТОГО") {
                    return '<span style="font-weight: bold; color: black">' + t.value + '<span>';
                }
                if (_this.noPlanCats.indexOf(t.value) !== -1) {
                    return '<span style="font-weight: bold; color: red">' + t.value + '<span>';
                }
                return t.value;
            }

            /**
             * Fires after chart have been redrawn
             * Used to add class to summary bar, that will make it bigger
             */
            function onRedraw() {
                if (_this.chart) {
                    if (_this.chart.series.length > 4) {
                        for (var i = 5; i < _this.chart.series.length; i++)
                            if (_this.chart.series[i].data.length !== 0 && _this.chart.series[i].data[0].graphic && _this.chart.series[i].data[0].graphic.element)
                                _this.chart.series[i].data[0].graphic.element.setAttribute("class", "bar-summary");
                    }
                }
            }

            /**
             * Highchart bar click event handler
             * @param {object} e Highcharts click event
             */
            function onPointClick(e) {
                if (e.point.name === "ИТОГО") return;
                _this.basePointClick(e);
            }

            /**
             * Custom tooltip formatter for chart
             */
            function customFormatter() {
                /* jshint ignore:start */
                var t = this;
                /* jshint ignore:end */
                var planned = _this.chart.series[0].processedYData[t.point.index] || 0;
                var nepr = _this.chart.series[3].processedYData[t.point.index] || 0;
                var opl = _this.chart.series[4].processedYData[t.point.index] || 0;
                var sta = _this.chart.series[2].processedYData[t.point.index] || 0;
                var och = _this.chart.series[1].processedYData[t.point.index] || 0;
                if (planned === 0) planned = opl + nepr;
                var a = '<b>' + t.point.name + '</b><br>';
                a += "Запланировано: " + planned + "<br/>";
                a += "<span>&nbsp;</span><br/>";
                a += "Всего пролечено: " +  (opl + nepr) + " (" + Math.round((opl + nepr) / planned * 100).toFixed(0) +  "%)<br/>";
                a += "из них:<br/>";
                a += "<span>&nbsp;</span><span>&nbsp;</span><span>&nbsp;</span><span>принято к оплате: " + opl + " (" + Math.round(opl / planned * 100).toFixed(0) +  "%)</span><br/>";
                a += "<span>&nbsp;</span><span>&nbsp;</span><span>&nbsp;</span><span>не принято к оплате: " + parseInt(nepr) + " (" + Math.round(nepr / planned * 100).toFixed(0) +  "%)</span><br/>";
                a += "<span>&nbsp;</span><br/>";
                a += "Пребывает в стационаре: " + sta + " (" + Math.round(sta / planned * 100).toFixed(0) + "%)<br/>";
                a += "В очереди: " + och +  " (" + Math.round(och / planned * 100).toFixed(0) + "%)<br/>";
                a += "<span>&nbsp;</span><br/>";
                a += "Проноз выполнения плана: " + (opl + nepr + sta + och) + " (" +  Math.round((opl + nepr + sta + och) / planned * 100).toFixed(0) + "%)<br/>";
                return a;
            }

            /**
             * Parses data received from server
             * @param {object} data MDX result
             */
            function parseData(data) {
                _this.noPlanCats     = [];
                _this.oldParseData(data);
                var maxValue = 0;
                var i;
                var l;
                var temp;

                // Find categories without planned values
                for (i = 0, l = $scope.chartConfig.series[0].data.length; i < l; i++) {
                    if ($scope.chartConfig.series[0].data[i].y === null ||
                        $scope.chartConfig.series[0].data[i].y === undefined ||
                        $scope.chartConfig.series[0].data[i].y === "" ||
                        $scope.chartConfig.series[0].data[i].y === 0) {
                            $scope.chartConfig.series[8].data[i].y = 1;
                            _this.noPlanCats.push($scope.chartConfig.series[8].data[i].name);
                        }
                }

                // Setup custom colors for series
                var cols = [];
                cols[3] = "#7fa645";
                cols[3] = "#9fd84b";
                cols[2] = "#00b9ff";
                cols[1] = "#f7a35c";
                cols[0] = "#aaaaaa";
                for (i = 0; i < $scope.chartConfig.series.length; i++) {
                    $scope.chartConfig.series[i].color = cols[(i-1) % cols.length];
                    if (i < 5) {
                        $scope.chartConfig.series[i].visible = false;
                        $scope.chartConfig.series[i].showInLegend = false;
                    }
                }

                // Move summary on top
                var k = $scope.chartConfig.xAxis.categories.length;
                if (k > 1) {
                    temp = $scope.chartConfig.xAxis.categories[0];
                    $scope.chartConfig.xAxis.categories[0] = $scope.chartConfig.xAxis.categories[k - 1];
                    $scope.chartConfig.xAxis.categories[k - 1] = temp;

                    for (var n = 0, ls = $scope.chartConfig.series.length; n < ls; n++) {
                        k = $scope.chartConfig.series[n].data.length;
                        if (k > 1) {
                            temp = $scope.chartConfig.series[n].data[0];
                            $scope.chartConfig.series[n].data[0] = $scope.chartConfig.series[n].data[k - 1];
                            $scope.chartConfig.series[n].data[k - 1] = temp;
                        }
                    }
                }
            }

            this.requestData();
        }

        return BarChartPercent;
    }

    angular.module('widgets')
        .factory('BarChartPercent', ['BaseChart', 'Utils', BarChartPercentFact]);

})();