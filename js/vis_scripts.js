/*global window, $, vis, document, event, console */
/*jslint es6 */


function makeTextInput(placeholder, datalistID, value, number) {
    "use strict";

    // Create an input type dynamically.
    const element = document.createElement("input");

    // Assign different attributes to the element.
    element.setAttribute("type", "text");
    element.setAttribute("placeholder", placeholder);
    element.setAttribute("autocapitalize", "none");

    element.setAttribute("list", datalistID);

    if (value) {
        element.setAttribute("value", value);
    }

    if (number !== undefined) {
        element.setAttribute("id", "id_" + placeholder + "_" + number.toString());
    }

    return $(element);
}


function makeSourceBox(value, number) {
    "use strict";
    return makeTextInput("source", "components", value, number);
}


function makeDestinationBox(value, number) {
    "use strict";
    return makeTextInput("dest", "components", value, number);
}




function rowIsValid(rowObj) {
    "use strict";
    const tableTextBoxes = rowObj.find("input[type=text]");

    // Check that we have two text boxes and at least the source and destination are filled in
    return tableTextBoxes.length === 2 &&
        tableTextBoxes.eq(0).val().length &&
        tableTextBoxes.eq(1).val().length;
}


function countValidRows(tableObj) {
    /* Count the number of valid table rows (rows with a source and destination)*/
    "use strict";
    const tableBody = tableObj.children("tbody").first();
    const tableRows = tableBody.children("tr");
    let numberOfValidRows = 0;

    $.each(tableRows, function (ignore, value) {

        if (rowIsValid($(value))) {
            numberOfValidRows += 1;
        }
    });

    return numberOfValidRows;
}


function splitLine(text, maxLength) {
    "use strict";
    let subString = "";
    let remainingString = text;
    let newString = "";
    let spaceIndex
    while (remainingString.length > maxLength) {
        subString = remainingString.substring(0, maxLength + 1);
        spaceIndex = subString.lastIndexOf(" ");
        if (spaceIndex === -1) {
            newString += remainingString.substring(0, maxLength) + "-" + "\n";
            remainingString = remainingString.substring(maxLength);
        } else {
            newString += remainingString.substring(0, spaceIndex+1) + "\n";
            remainingString = remainingString.substring(spaceIndex+1);
        }
    }
    newString += remainingString;
    return newString;
}

function addNodeFromCell(tdObject, nodeArray, lineLength, datalist) {
    // This is messy but testable.
    // Pass in a <td></td> and an array of nodes,
    // get back the id of any nodes added or the id
    // of the matching node if it was already in nodeArray
    "use strict";
    let id = null;
    const input = tdObject.children("input").first();
    let displayText = "";
    if (lineLength === "none") {
        displayText = input.val();
    } else {
        displayText = splitLine(input.val(), parseInt(lineLength));
    }

    // do we have a node for this already?
    nodeArray.some(function (element) {
        if (element.id === input.val()) {
            id = element.id;
            return true;
        }
    });

    if (!id) {
        id = input.val();
        nodeArray.push({id: id,
                        label: displayText
        });
        datalist.append(
            "<option value='" + id + "'>"
        );
    }

    return id;
}


function graphFromTable(tableObj, lineLengthMenu, datalist) {
    "use strict";
    datalist.empty(); // empty datalist to be refille

    const lineLength = lineLengthMenu.val();
    const tableBody = tableObj.children("tbody").first();
    const tableRows = tableBody.children("tr");

    const nodes = [];
    const edges = [];

    $.each(tableRows, function (ignore, value) {
        const tableRow = $(value);
        if (rowIsValid(tableRow)) {
            // Get source
            const srcTD = tableRow.children("td").eq(0);

            // If source is not in nodes already, add it
            const srcID = addNodeFromCell(srcTD, nodes, lineLength, datalist);
            // Get dest
            const dstTD = tableRow.children("td").eq(1);

            // If dest is not in nodes already, add it
            const dstID = addNodeFromCell(dstTD, nodes, lineLength, datalist);

            // Add edge
            edges.push({from: srcID,
                        to: dstID,
                        arrows: "to"});
        }
    });

    return {
        nodes: nodes,
        edges: edges,
        lineLength: lineLength
    };
}


// function getNodePositionsFromNetwork(graph, network) {
//     "use strict";
//     network.storePositions();
//     network.body.data.nodes.forEach(function (oldNode, ignore) {
//        graph.nodes.forEach(function (newNode, ignore) {
//            // copy the Xs and Ys of the existing graph
//            if (newNode.label === oldNode.label) {
//                newNode.x = oldNode.x;
//                newNode.y = oldNode.y;
//            }
//        });
//     });
//
// }


function getNodePositionsFromNetwork(graph, network) {
    "use strict";
    const nodePositions = network.getPositions();
    graph.nodes.forEach(function (node, ignore) {
        if (nodePositions.hasOwnProperty(node.id)){
            // copy the Xs and Ys of the existing graph
            node.x = nodePositions[node.id].x;
            node.y = nodePositions[node.id].y;
        }
   });
}

function getNodeOptions(graph, network) {
    let nodeShape = network.nodesHandler.options.shape;
    const borderColor = network.nodesHandler.options.color.border;
    if (borderColor === "#ffffff" && nodeShape === "box") {
        nodeShape = "text"
    }
    graph.fontStyle = network.nodesHandler.options.font.face;
    graph.fontSize = network.nodesHandler.options.font.size;
    graph.shape = nodeShape;
}

function getVisOptions() {
    let visOptions = {
        physics: false, // if false then a -> b & b -> a overlaps and labels get messy
                        // we could give the user some warning to set one connector to simple
        width: "100%",
        height: "500px",
        edges: {
            length: 1000, // this doesn't seem to do anything.  Confirm and report a bug...
            color: {
                color:'#000000'
            },
            smooth: false,
            arrowStrikethrough: false // note we may want to make the node borders a little thicker
        },
        nodes: {
            color: {
                border: '#ffffff',
                background: '#ffffff'
            },
            shapeProperties: {
                borderRadius: 0,
            },
            shape: 'box',
            scaling: {
                label: {
                    enabled: true,
                },
            },
            margin: 8,
            font: {
                size: 16,
                face: "arial",  //https://fonts.googleapis.com/css?family=Neucha|Patrick+Hand+SC
                color: "black"
            }
        },
        layout: {
            hierarchical: false,
            randomSeed: 10161
        },
        interaction: {
            dragView: false,
            keyboard: {
                enabled: false,
                speed: {x: 3, y: 3, zoom: 0.01},
            },
            zoomView: false,
            navigationButtons: true,
        }
    };
    return visOptions;
}


function makeEmptyNetwork(drawingArea) {
    "use strict";
    const visContainer = drawingArea[0];
    let visOptions = getVisOptions();
    const visNetwork = new vis.Network(visContainer, {}, visOptions);

    // Perhaps add an image background to the canvas
    // const background = new Image();
    // background.src = "images/black_on_blue.svg";
    //
    // visNetwork.on("beforeDrawing",
    // function(canvasContext){
    //     console.log(canvasContext);
    //     canvasContext.drawImage(background, -600, -600);
    // });

    return visNetwork;
}


function setNetworkData(graph, network) {
    "use strict";
    const visNodes = new vis.DataSet(graph.nodes);
    const visEdges = new vis.DataSet(graph.edges);

    const visData = {
        nodes: visNodes,
        edges: visEdges
    };

    network.setData(visData);
}

function addSelectMenu(options, containerID, selected) {
    "use strict"
    const menuContainer = document.getElementById(containerID);
    let selectMenu = $('<select>');
    $(options).each(function() {
        let option = $("<option>").attr('value',this.val).text(this.text);
        if (this.val === selected) {
            option.attr('selected', 'selected');
        }
        selectMenu.append(option);
    });
    selectMenu.appendTo(menuContainer);
    return selectMenu;
}

function setStyle(visNetwork, menus) {
    "use strict"
    const shapeStyle = menus.shapeMenu.val();
    const fontSize = menus.fontSizeMenu.val();
    const fontStyle = menus.fontStyleMenu.val();

    let visOptions = getVisOptions();
    if (['square', 'diamond', 'dot'].includes(shapeStyle)) {
        visOptions.nodes.size = 5;
        visOptions.nodes.color.background = '#000000';
    } else {
        visOptions.nodes.color.background = '#ffffff';
    }
    if (shapeStyle === "text") {
        visOptions.nodes.shape = 'box';
        visOptions.nodes.color.border = '#ffffff';
        visOptions.nodes.margin = 3;
    } else {
        visOptions.nodes.shape = shapeStyle;
        visOptions.nodes.color.border = '#000000';
    }
    visOptions.nodes.font.size = parseInt(fontSize);
    visOptions.nodes.font.face = fontStyle;
    visNetwork.setOptions(visOptions);
}


function addDownloadLink(downloadID, drawingArea) {
    "use strict";
    const downloadLink = document.getElementById(downloadID);

    // ToDo Shouldn't we be assuming that the first canvas is our canvas of interest?
    const networkCanvas = drawingArea.find("canvas").first()[0];

    // Make a new canvas for the download link
    const downloadCanvas = document.createElement("canvas");

    downloadCanvas.width = networkCanvas.width;
    downloadCanvas.height = networkCanvas.height;
    const downloadContext = downloadCanvas.getContext("2d");

    // Create a rectangle with the desired color
    downloadContext.fillStyle = "#ffffff";
    downloadContext.fillRect(0, 0, networkCanvas.width, networkCanvas.height);

    // Draw the original canvas onto the destination canvas
    downloadContext.drawImage(networkCanvas, 0, 0);

    downloadLink.setAttribute("href", downloadCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));

    // In case you want to choose a different random seed
    // console.log("random seed: " + network.getSeed());
}


function serialiseGraph(graphData) {
    "use strict";
    return JSON.stringify(graphData);
}


function deserialiseGraph(serialisedGraph) {
    "use strict";
    return JSON.parse(serialisedGraph);
}


function deleteEdgeIDs(graph) {
    "use strict";

    // Seems to be a common way to deep copy
    const newGraph = JSON.parse(JSON.stringify(graph));

    newGraph.edges.forEach(
        function (edge) {
            delete edge.id;
        });

    return newGraph;
}


function updateExportURL(graph, linkObject) {
    "use strict";

    // We should really deal with these edge IDs elsewhere
    const graphWithoutIDs = deleteEdgeIDs(graph);

    // const linkURL = window.location.origin +  "?serialised=" + encodeURIComponent(serialiseGraph(graphWithoutIDs));
    const linkURL = location.protocol + "//" + location.host + location.pathname +
        "?serialised=" + encodeURIComponent(serialiseGraph(graphWithoutIDs));

    if (linkURL.length > 2082) {
        linkObject.text("The URL would have been over 2,083 characters.  " +
            "That is the upper limit of some browsers.  Consider shortening the names of some of your components.");
    } else {
        linkObject.text(linkURL);
    }
}


function makeRedrawFunc(setExportURL, setDownloadLink, visNetwork, tableObj, menus, datalist) {
    "use strict";

    // When the user repositions a node, we need to update the export and download links
    visNetwork.on("release",
                  function(){
                      const graph = graphFromTable(tableObj, menus.lineLengthMenu, datalist);
                      getNodePositionsFromNetwork(graph, visNetwork);
                      getNodeOptions(graph, visNetwork);
                      setExportURL(graph);
                      setDownloadLink();
                  }
    );

    return function redraw() {
        // ToDo This function does too much, break it up
        setStyle(visNetwork, menus)
        const graph = graphFromTable(tableObj, menus.lineLengthMenu, datalist);
        let scale;
        let position;

        getNodePositionsFromNetwork(graph, visNetwork);
        getNodeOptions(graph, visNetwork);

        scale = visNetwork.getScale();
        position = visNetwork.getViewPosition();

        setNetworkData(graph, visNetwork);

        visNetwork.redraw();

        setExportURL(graph);

        // Keep the old position, if there are any
        if (position === undefined) {
            position = visNetwork.getViewPosition();
        }

        if (scale === undefined) {
            scale = 1.2;
        }

        visNetwork.moveTo({
            position: position,
            scale: scale
        });

        setDownloadLink();
    };
}


function makeDeleteButton(redrawFunc) {
    "use strict";

    // Create an input type dynamically.
    const element = document.createElement("input");

    // Assign attributes to the element.
    element.setAttribute("type", "button");
    element.setAttribute("value", "-");

    let jqe = $(element);

    jqe.click(
        function () {
            $(this).closest("tr").remove();

            redrawFunc();

            return false;
        }
    );

    return jqe;
}


function addRow(tableObj, redrawFunc, sourceVal, destVal) {
    "use strict";
    const tableBody = tableObj.children("tbody").first();

    // if the last row has focus, we will later set the focus to the last source input
    const childRows = tableBody.children("tr");
    const lastRowCells = childRows.eq(childRows.length - 1).children("td");
    let lastRowHasFocus = false;

    // Note, focus is lost if the user clicks a delete button
    lastRowCells.each(function () {
        // assume each cell only has one child element
        if ($(this).children().first().is($(document.activeElement))) {
            lastRowHasFocus = true;
        }
    });

    // Insert a row at the end of the table
    const newRow = tableBody[0].insertRow(tableBody[0].rows.length);

    // Insert a cell in the row at index 0
    let srcCell = newRow.insertCell(0);
    let srcBox = makeSourceBox(sourceVal);

    srcBox.focusout(redrawFunc);

    srcBox.appendTo(srcCell);

    if (lastRowHasFocus) {
        srcBox.focus();
    }

    const dstCell = newRow.insertCell(1);
    const dstBox = makeDestinationBox(destVal);

    dstBox.focusout(redrawFunc);

    dstBox.appendTo(dstCell);

    const deleteCell = newRow.insertCell(2);
    makeDeleteButton(redrawFunc).appendTo(deleteCell);

    return tableBody;
}


function makeTable(tableID) {
    "use strict";
    return $("<table id='" + tableID + "'>\n" +
               "<thead>\n" +
                 "<tr>\n" +
                   "<th>From</th>\n" +
                   "<th>To</th>\n" +
                   "<th>\n" +
                     "<input type='button' value='+'/>\n" +
                   "</th>\n" +
                 "</tr>\n" +
               "</thead>\n" +
               "<tbody>\n" +
               "</tbody>\n" +
             "</table>");
}


function makeComponentsDatalist() {
    "use strict";
    let datalistString = "<datalist id='components'>";
    datalistString += "</datalist>";
    return $(datalistString);
}


function deleteRowFrom(tableObj, idx, redrawFunc) {
    "use strict";
    const tableBody = tableObj.children("tbody").first();

    // if the last row has focus, set the focus to the last but one destination input
    const childRows = tableBody.children("tr");
    const lastRowCells = childRows.eq(childRows.length - 1).children("td");
    const lastButOneRow = childRows.eq(childRows.length - 2);
    let lastRowHasFocus = false;

    // Note, focus is lost if the user clicks a delete button
    lastRowCells.each(function () {
        // assume each cell only has one child element
        if ($(this).children().first().is($(document.activeElement))) {
            lastRowHasFocus = true;
        }
    });

    if (lastRowHasFocus) {
        lastButOneRow.children("td").eq(2).children("input").first().focus();
    }

    tableBody.children("tr").eq(idx).remove();

    redrawFunc();
}


function deleteLastDataRowFrom(tableObj, redrawFunc) {
    // This is a safe delete function, it will always leave the
    //  headers and the add button.
    "use strict";
    const tableBody = tableObj.children("tbody").first();

    if (tableBody.find("tr").length > 1) {
        deleteRowFrom(tableObj, tableBody.children("tr").length - 1, redrawFunc);
    }
}


/* Get query parameters from the URL
   e.g. www.my-site.com?something=a_thing&what=why
        will return a dict with something and what as keys
   You can call it like this getQueryParams(document.location.search)*/
function getQueryParams(queryString) {
    "use strict";
    queryString = queryString.split("+").join(" ");

    let params = {};
    let tokens;
    const re = /[?&]?([^=]+)=([^&]*)/g;

    do {
        tokens = re.exec(queryString);
        if (tokens) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        } else {
            break;
        }
    } while (true);

    return params;
}


function addDataFromURL(serialisedData, tableObj, redrawFunc, visNetwork, menus) {
    "use strict";
    const unpackedData = deserialiseGraph(serialisedData);

    // Set options if present in URL otherwise use defaults
    let options = {
        fontSize: "16",
        fontStyle: "arial",
        nodeShape: "text",
        lineLength: "none"
    };
    if  (typeof unpackedData.fontSize !== "undefined") {
        options.fontSize = unpackedData.fontSize.toString();
    }
    if (typeof unpackedData.shape !== "undefined") {
        options.nodeShape = unpackedData.shape;
    }
    if (typeof unpackedData.fontStyle !== "undefined") {
        options.fontStyle = unpackedData.fontStyle;
    }
    if (typeof unpackedData.lineLength !== "undefined") {
        if (unpackedData.lineLength === "none") {
            options.lineLength = unpackedData.lineLength;
        } else {
            options.lineLength = unpackedData.lineLength;
        }
    }
    updateSelected(visNetwork, menus, options);

    // ToDo Re-write this using array.some()
    // We will manually add the graph data to the table
    unpackedData.edges.forEach(function (edge) {
        let fromLabel = null;
        let toLabel = null;

        // get the labels for the nodes connected by this edge
        unpackedData.nodes.forEach(function (node) {
            if (node.id === edge.from) {
                fromLabel = node.id;
            }

            if (node.id === edge.to) {
                toLabel = node.id;
            }
        });

        if (fromLabel && toLabel) {
            addRow(tableObj, redrawFunc, fromLabel, toLabel);
        }
    });

    // We will also set the visNetwork data directly this one time.
    // This is necessary because we can't store the node x and y coordinates in the table
    // and hope for them to be displayed later
    setNetworkData(unpackedData, visNetwork);
}


function addSampleData(tableObj, redrawFunc, visNetwork, menus) {
    "use strict";

    // The sample data
    const smoking_obesity_cancer =
        "{\"nodes\":[" +
            "{\"id\":\"Smoking\",\"label\":\"Smoking\",\"x\":0,\"y\":-60}," +
            "{\"id\":\"Obesity\",\"label\":\"Obesity\",\"x\":-120,\"y\":60}," +
            "{\"id\":\"Lung cancer\",\"label\":\"Lung cancer\",\"x\":120,\"y\":60}]," +
        "\"edges\":[" +
            "{\"from\":\"Smoking\",\"to\":\"Obesity\",\"arrows\":\"to\"}," +
            "{\"from\":\"Obesity\",\"to\":\"Lung cancer\",\"arrows\":\"to\"}," +
            "{\"from\":\"Smoking\",\"to\":\"Lung cancer\",\"arrows\":\"to\"}]}";

    // You can create a sample graph on the home page and then use the permalink as sample data
    addDataFromURL(
        smoking_obesity_cancer,
        tableObj,
        redrawFunc,
        visNetwork,
        menus);
}


function removeSampleData(tableObj) {
    "use strict";
    const tableBody = tableObj.children("tbody").first();
    tableBody.empty();
}


function makeRefreshButton(refreshFunc) {
    "use strict";
    const button = $("<input type=\"button\" class=\"btn-small\" value=\"Refresh\"/>");

    button.click(refreshFunc);

    return button;
}


function setKeydownListener(tableObj, redrawFunc) {
    "use strict";
    if (! window.hasOwnProperty("pressedKeys")) {
        window.pressedKeys = {};
    }

    $(document.body).keyup(function (evt) {

        evt = evt || event; // to deal with IE
        window.pressedKeys[evt.keyCode] = evt.type === "keydown";
    });

    $(document.body).keydown(function (evt) {

        evt = evt || event; // to deal with IE
        window.pressedKeys[evt.keyCode] = evt.type === "keydown";

        // Shift + Enter to delete last row or Enter for new row
        if (window.pressedKeys[13]) {
            if (window.pressedKeys[16]) {
                deleteLastDataRowFrom(tableObj, redrawFunc);
            } else {
                addRow(tableObj, redrawFunc);
                redrawFunc();
            }
        }
    });
}


function setUpSingleDrawingPage(inputDivID, drawingDivID, exportURLID, downloadID, menuIDs) {
    "use strict";

    // Make a data lists for use by the table
    const datalist = makeComponentsDatalist().appendTo($("body"));

    const inputDiv = $("#" + inputDivID);
    const drawingArea = $("#" + drawingDivID);

    const setExportURL = function (graph) {
        updateExportURL(graph, $("#" + exportURLID));
    };

    // Make a new canvas for the download link
    //const downloadCanvas = document.createElement("canvas");

    const setDownloadLink = function () {
        addDownloadLink(downloadID, drawingArea);
    };

    const visNetwork = makeEmptyNetwork(drawingArea);

    const inputTable = makeTable("inputTable");

    const lineLengthMenu = addSelectMenu(getLineLengthOptions(), menuIDs.lineLengthMenuID, "none")
    const shapeMenu = addSelectMenu(getShapeOptions(), menuIDs.shapeMenuID, "text");
    const fontSizeMenu = addSelectMenu(getFontSizeOptions(), menuIDs.fontSizeMenuID, "16");
    const fontStyleMenu = addSelectMenu(getFontStyleOptions(), menuIDs.fontStyleMenuID, "arial")

    const menus = {
        shapeMenu: shapeMenu,
        fontSizeMenu: fontSizeMenu,
        lineLengthMenu: lineLengthMenu,
        fontStyleMenu: fontStyleMenu
    }

    const redrawMe = makeRedrawFunc(setExportURL, setDownloadLink, visNetwork, inputTable, menus, datalist);

    const button = inputTable.find("input").first();

    button.click(function(){
        addRow(inputTable, redrawMe);
    });

    inputDiv.append(inputTable);

    drawingArea.parent().append(makeRefreshButton(redrawMe));

    const queryParams = getQueryParams(document.location.search);
    
    if (queryParams.hasOwnProperty("serialised")) {
        addDataFromURL(queryParams.serialised, inputTable, redrawMe, visNetwork, menus);
        redrawMe();
    } else {
        addSampleData(inputTable, redrawMe, visNetwork, menus);
        redrawMe();
    }

    shapeMenu.change(function(){
        redrawMe();
    });

    fontSizeMenu.change(function(){
        redrawMe();
    });

    lineLengthMenu.change(function(){
        redrawMe();
    });

    fontStyleMenu.change(function(){
       redrawMe();
    });

    setKeydownListener(inputTable, redrawMe);
}

function updateSelected(network, menus, options) {
    function updateMenu(menu, option) {
        if (typeof option !== "undefined") {
            menu.children().each(function () {
                if (this.value === option) {
                    $(this).attr('selected', 'selected');
                } else {
                    $(this).removeAttr('selected');
                }
            });
        }
    }
    updateMenu(menus.fontSizeMenu, options.fontSize);
    updateMenu(menus.shapeMenu, options.nodeShape);
    updateMenu(menus.lineLengthMenu, options.lineLength);
    updateMenu(menus.fontStyleMenu, options.fontStyle);
}


function getShapeOptions() {
    "use strict";
    const shapeOptions = [
        {val: "text", text: "Text"},
        {val: "box", text: "Box"},
        {val: "ellipse", text: "Ellipse"},
        {val: "diamond", text: "Diamond"},
        {val: "dot", text: "Dot"},
        {val: "square", text: "Square"}
    ]
    return shapeOptions;
}

function getFontSizeOptions() {
    "use strict";
    const fontSizeOptions = [
        {val: "8", text: "8"},
        {val: "10", text: "10"},
        {val: "12", text: "12"},
        {val: "14", text: "14"},
        {val: "16", text: "16"},
        {val: "18", text: "18"},
        {val: "20", text: "20"},
        {val: "22", text: "22"},
        {val: "24", text: "24"},
        {val: "26", text: "26"},
        {val: "28", text: "28"}
    ]
    return fontSizeOptions;
}

function getFontStyleOptions() {
    "use strict";
    const fontStyleOptions = [
        {val: "arial", text: "Arial"},
        {val: "arial black", text: "Arial Black"},
        {val: "times new roman", text: "Times New Roman"},
        {val: "courier new", text: "Courier New"},
        {val: "verdana", text: "Verdana"}
    ]
    return fontStyleOptions;
}

function getLineLengthOptions() {
    "use strict";
    const lineLengthOptions = [
        {val: "none", text: "none"},
        {val: "4", text: "4"},
        {val: "6", text: "6"},
        {val: "8", text: "8"},
        {val: "10", text: "10"},
        {val: "12", text: "12"},
        {val: "14", text: "14"},
        {val: "16", text: "16"},
        {val: "18", text: "18"},
        {val: "20", text: "20"}
    ]
    return lineLengthOptions
}


function copyToClipboard(idExportLink) {
    "use strict";
    const textArea = document.createElement("textarea");  // Create a <textarea> element
    textArea.value = $("#" + idExportLink).text();                // Set its value to the string that you want copied
    textArea.setAttribute("readonly", "");      // Make it readonly to be tamper-proof
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";                      // Move outside the screen to make it invisible
    document.body.appendChild(textArea);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0         // Check if there is any content selected previously
        ? document.getSelection().getRangeAt(0)  // Store selection if found
        : false;                                       // Mark as false to know no selection existed before
    textArea.select();                                 // Select the <textarea> content
    document.execCommand("copy");            // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(textArea);               // Remove the <textarea> element
    if (selected) {                                    // If a selection existed before copying
        document.getSelection().removeAllRanges();     // Unselect everything on the HTML document
        document.getSelection().addRange(selected);    // Restore the original selection
    }
}
