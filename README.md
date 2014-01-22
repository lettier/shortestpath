![Alt text](https://raw.github.com/lettier/shortestpath/master/screenshot.jpg)
 
# Shortest Path
 
An interactive HTML5 canvas graph where the edge weights are the euclidean pixel distance between any one edge's incident nodes. Upon selecting a source node and a terminal node, you can see the shortest path (if a path does exist) between them by pressing `Begin`. Dijkstra's algorithm is used to compute the shortest path. To see the shortest path between any other two nodes, press `Reset`. For a whole new graph, press `New Graph`.

`./source/canvas_version` contains the latest version utilizing only the HTML5 canvas object and no other third-party libraries.

`./source/fabric_js_version` contains the original version that uses the Fabric.js canvas library. Note that [Fabric.js 1.4.0](https://github.com/kangax/fabric.js/releases/tag/v1.4.0) is needed.  

Playable at http://www.lettier.com/shortest_path/.  
 
_(C) 2014 David Lettier._  
http://www.lettier.com/