﻿import {uuid, toFixed} from '../common/utils.js';
import _ from 'lodash';
/*
 * Created by Mahboob.M on 2/8/16.
 */

var STOCHS = function (data, options, indicators) {
    options.fastKMaType = (options.fastKMaType || 'SMA').toUpperCase();
    options.slowKMaType = (options.slowKMaType || 'SMA').toUpperCase();
    options.slowDMaType = (options.slowDMaType || 'SMA').toUpperCase();
    IndicatorBase.call(this, data, options, indicators);
    this.uniqueID = [uuid(), uuid()];

    /*Fast %K = 100 SMA ( ( ( Close - Low ) / (High - Low ) ),Time Period )
    Fast %D: Simple moving average of Fast K (usually 3-period moving average)
    */
    this.stochf = new STOCHF(data, { fastKPeriod: this.options.fastKPeriod, fastKMaType: this.options.fastKMaType, appliedTo: this.options.appliedTo }, indicators);
    this.kMa = new window[this.options.slowKMaType](this.stochf.kData, { period: this.options.slowKPeriod, maType: this.options.slowKMaType }, indicators);
    this.indicatorData = this.kMa.indicatorData;
    var kData = [];
    this.indicatorData.forEach(function (e) {
        kData.push({ time: e.time, close: e.value });
    });
    this.dData = new window[options.slowDMaType](kData, { period: this.options.slowDPeriod, maType: this.options.slowDMaType }, indicators);
};

STOCHS.prototype = Object.create(IndicatorBase.prototype);
STOCHS.prototype.constructor = STOCHS;

STOCHS.prototype.addPoint = function (data) {
    var stoch = this.stochf.addPoint(data)[0].value;
    var kMa = this.kMa.addPoint({time:data.time , close:stoch})[0].value;
    this.indicatorData = this.kMa.indicatorData;
    var dValue = this.dData.addPoint({time:data.time , close:kMa})[0].value;
    return [{
        id: this.uniqueID[0],
        value: kMa
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCHS.prototype.update = function (data) {
    var stoch = this.stochf.update(data)[0].value;
    var kMa = this.kMa.update({time:data.time , close:stoch})[0].value;
    this.indicatorData = this.kMa.indicatorData;
    var dValue =this.dData.update({time:data.time , close:kMa})[0].value;
    return [{
        id: this.uniqueID[0],
        value: kMa
    }, {
        id: this.uniqueID[1],
        value: dValue
    }];
};

STOCHS.prototype.toString = function () {
    return  'STOCHS (' + this.options.slowKPeriod + ', '+ this.options.slowDPeriod + ', ' + this.indicators.appliedPriceString(this.options.appliedTo) + ')';
};

/**
 * @param indicatorMetadata
 * @returns {*[]}
 */
STOCHS.prototype.buildSeriesAndAxisConfFromData = function(indicatorMetadata) {
    //Prepare the data before sending a configuration
    var stochsData = [];
    this.indicatorData.forEach(function (e) {
        stochsData.push([e.time, e.value]);
    });
    var dData = [];
    this.dData.indicatorData.forEach(function (e) {
        dData.push([e.time, e.value]);
    });

    return [{
        axisConf: { // Secondary yAxis
            id: indicatorMetadata.id + '-' + this.uniqueID[0],
            title: {
                text: this.toString(),
                align: 'high',
                offset: 0,
                rotation: 0,
                y: 10,
                x: 30+ this.toString().length * 7.5
            },
            lineWidth: 2,
            plotLines: this.options.levels
          }
        },
        {
             seriesConf: {
                 id: this.uniqueID[0],
                 name: this.toString(),
                 data: stochsData,
                 type: 'line',
                 yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                 color: this.options.stroke,
                 lineWidth: this.options.strokeWidth,
                 dashStyle: this.options.dashStyle,
                 onChartIndicator: false
             }
         },
        {
            seriesConf: {
                id: this.uniqueID[1],
                name: '%D',
                data: dData,
                type: 'line',
                yAxis: indicatorMetadata.id + '-' + this.uniqueID[0],
                color: this.options.dStroke,
                lineWidth: this.options.strokeWidth,
                dashStyle: this.options.dashStyle,
                onChartIndicator: false
            }
        }
    ];
};

/**
 * This method will return all IDs that are used to identify data series configuration
 * in the buildSeriesAndAxisConfFromData method.
 * @returns {*[]}
 */
STOCHS.prototype.getIDs = function() {
    return this.uniqueID;
};

/**
 * If all the unique IDs generated by this instance is same as what is passed in the parameter,
 * then we consider this instance to be same as what caller is looking for
 * @param uniqueIDArr
 * @returns {boolean}
 */
STOCHS.prototype.isSameInstance = function(uniqueIDArr) {
    return _.isEqual(uniqueIDArr.sort(), this.uniqueID);
};


window.STOCHS = STOCHS;
