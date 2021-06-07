// src/index.js

// Include the core fusioncharts file from core
import FusionCharts from 'fusioncharts/core';

// Include the chart from viz folder
// E.g. - import ChartType from fusioncharts/viz/[ChartType]
import heatmap from 'fusioncharts/viz/heatmap';

// Include the fusion theme
import FusionTheme from 'fusioncharts/themes/es/fusioncharts.theme.fusion';

//Create a div tag for the container for heatmaps
const myDiv = document.createElement('div');
myDiv.id = 'chart-container';
document.body.appendChild( myDiv )

//main function for rendering the html page
async function main() {
    //Get the data
    let response = await fetch('/mlRepo');
    let data = await response.text();
    if (response.ok){        
        renderPage(data);
    }
    else {
        alert('Error reading data from ML repository');
    }
}

//renders the html page when passed data as csv-text
function renderPage(csvText){
    var irisCols = ['Sepal-length','Sepal-width','Petal-length','Petal-width','Class']; 
    var matrix = csvToMatrix(csvText,',');
    var avg = getAverage(matrix);
    var dataset = constructDatasetJson(avg.avgMatrix,irisCols,avg.classes);
    var jsonArr = constructDataSourceJson(dataset,irisCols,avg.classes);
    renderChart(jsonArr);
}

//convert csv text to matrix
function csvToMatrix(csvText,sep=','){
    var matrix = [];
    var rows = csvText.split("\n");
    for(var i=0;i<rows.length;i++){
        var cols = rows[i].split(sep);
        if (cols.length > 1)
        matrix.push(cols);
    }
    return matrix;
}


//helper function to get unique items in array
function unique(value, index, self){
    return self.indexOf(value) === index;
}


//compute the average of each column
function getAverage(matrix){
    var avgMatrix = [];
    var rows = matrix.length;
    var cols = matrix[0].length;
    //find the unique classes (iris species)
    var classes = matrix.map(function(value,index) {return value[cols-1];});
    classes = classes.filter(unique);
    //JSON for dataset
    var dataset = [];   
    //for each iris species/class
    for (var k=0;k<classes.length;++k)
    {
        var className = classes[k];        
        var rowData = [];
        //get the subset matrix for class k
        var subset = matrix.filter(r=>r[cols-1].match(className));
        //for each column
        for (var j=0;j<cols-1;++j)
        {
            //collect the average by moving along each row
            var avg = 0;
            for (var i=0;i<subset.length;++i)            
                avg += parseFloat(subset[i][j]);

            avg = avg/subset.length;
            rowData.push(avg);            
        }
        avgMatrix.push(rowData);
    }
    return {avgMatrix,classes};    

}

//returns JSON text for 'dataset' key 
function constructDatasetJson(matrix,colheads,rowHeads){
    
    var rows = matrix.length;
    var cols = matrix[0].length;
    
    //JSON for data
    var data = [];   
    for (var i=0;i<rows;++i)
    {   
        for (var j=0;j<cols;++j)
        {
            var obj = {};
            obj['rowid'] = rowHeads[i];
            obj['columnid'] = colheads[j];
            obj['value'] = matrix[i][j];            
            data.push(obj);
        }
    }
    //JSON for dataset
    var dataset = [];
    dataset.push({data:data});
    return dataset;
}

//constructs JSON text for 'dataSource' key
function constructDataSourceJson(dataset,colheads,rowHeads){
    var colorRange =  {
        gradient: "1",
        minvalue: "0",
        code: "#862d2d",
        startlabel: "Small",
        endlabel: "Very large",
        color: [
          {
            code: "#ff9933",
            maxvalue: "2"
          },
          {
            code: "#FFFFFF",
            maxvalue: "4"
          },
          {
            code: "#9ae5e5",
            maxvalue: "5.5"
          },
          {
            code: "#004d4d",
            maxvalue: "7"
          }
        ]
  };
  
  var JsonArr = {chart: {
        caption: "Average Feature Values for Iris Dataset Grouped by Species",
        subcaption: "Data Source: UCI Machine Learning Repository",
        xAxisName: "Iris Features",
        yAxisName: "Iris Class",
        showvalues: "1",
        plottooltext:
         "<div><b>$rowLabel</b><br/>$columnLabel Average Value: <b>$dataValue</b></div>",
        theme: "fusion"
    }, dataset,colorrange:colorRange};     
    return JsonArr;
}

// Draw the chart
function renderChart(dataSrc){
    FusionCharts.addDep(heatmap);
    FusionCharts.addDep(FusionTheme);
    //Chart Configurations
    const chartConfig = {
        type: 'heatmap',
        renderAt: 'chart-container',
        width: '50%',
        height: '500',
        dataFormat: 'json',
        dataSource: dataSrc
    }
    //Create an Instance with chart options and render the chart
    var chartInstance = new FusionCharts(chartConfig);
    chartInstance.render();
}

main();
  

