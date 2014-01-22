/*
 * 
 * David Lettier (C) 2014.
 * 
 * http://www.lettier.com/
 * 
 * Renders a graph on screen and uses Dijkstra's Algorithm to find the shortest path
 * between two user selected nodes. The edge weights are the euclidean pixel distance
 * between the adjacent nodes.
 * 
 */

// The following controls the total number of nodes in the graph.
 
var NUMBER_OF_NODES = 5;

// Constants.

var NODE_RADIUS       = 28;
var NODE_STROKE_WIDTH = 5;

var NODE_BASE_COLOR          = "#45f";
var NODE_FROM_COLOR          = "#4e9a06";
var NODE_TO_COLOR            = "#f33";
var NODE_NOT_VISITED_COLOR   = "#ddd";
var NODE_VISITED_COLOR       = "#555";
var SHORTEST_PATH_EDGE_COLOR = "#9335d9";
var EDGE_BASE_COLOR          = "#FCB721";
var EDGE_NOT_VISITED_COLOR   = "#ddd";

// Used to track what nodes have been selected also what nodes to use to when backtracking the shortest path.

var node_from_selected_matrix_index = -1;
var node_to_selected_matrix_index   = -1;
var nodes_selected                  =  0;

// Canvas global.
 
var canvas = null;

// Create the adjacency matrix for the graph.
 
function create_adjacency_matrix( )
{

	adjacency_matrix = [ ];
	
	// Initialize all nodes to not be adjacent to any other nodes. 
	
	for ( row = 0; row < NUMBER_OF_NODES; ++row )
	{
	
		row_temp = [ ];
		
		for ( col = 0; col < NUMBER_OF_NODES; ++col )
		{
		
			row_temp.push( -1 );
		
		}
		
		adjacency_matrix.push( row_temp );
	
	}
	
	// Begin filing in the adjacency matrix with random neighbors.
	// -1 equals not adjacent.	
	//  1 equals adjacent.
	//  0 equals adjacent but the distance between the two nodes is zero.
	// For now zero is not used but will be used later since the adj. matrix later holds the distances
	// between adjacent nodes.
	
	// Iterate through the top right half diagonal of the matrix.
	
	for ( row = 0; row < NUMBER_OF_NODES; ++row )
	{
		
		for ( col = row; col < NUMBER_OF_NODES; ++col )
		{
		
			if ( row === col )
			{
				continue; // No loop edges.
				
			}
			
			adjacent = random_integer_in_range( 0, 1 );
			
			if ( adjacent === 1 )
			{
				
				adjacency_matrix[ row ][ col ] = adjacent;
			
				adjacency_matrix[ col ][ row ] = adjacent;
			
			}
			else
			{
			
				adjacent = -1;
				
				adjacency_matrix[ row ][ col ] = adjacent;
			
				adjacency_matrix[ col ][ row ] = adjacent;
			
			}
		
		}
	
	}
	
	return adjacency_matrix;

}

// Create the visual graph with all nodes and edges based on the adjacency matrix.

function create_graph( canvas, adjacency_matrix )
{

	// This function uses Fabric.js to create a canvas node.
	
	function create_canvas_node( x, y, label )
	{
		
		// Each visual node is comprised of a circle and a text label.
		
		var circle = new fabric.Circle( {
			
			strokeWidth: NODE_STROKE_WIDTH,
			
			radius: NODE_RADIUS,
			
			fill: NODE_BASE_COLOR,
			
			stroke: NODE_BASE_COLOR
			
		} );
		
		circle.hasControls = circle.hasBorders = false;
		
		circle.setShadow( "0px 0px 10px rgba( 0, 0, 0, 0.7 )" );
		
		var text = new fabric.Text( label.toString( ), {
		
			fontSize: 20,
			
			fontFamily: "Verdana, sans-serif",
			
			fill: "#fff"
			
		} );
		
		var canvas_node = new fabric.Group( [ circle, text ], {
			
			left: x,
			
			top: y,
			
		} );
		
		canvas_node.hasControls = canvas_node.hasBorders = false;

		return canvas_node;
		
	}
	
	// This function uses Fabric.js to create a canvas edge.
	// The edge label is the euclidean distance between the edge terminating nodes.
	
	function create_canvas_edge( canvas, coordinates, label ) 
	{
		
		// Each visual canvas edge is comprised of a line and a text label.
		
		var canvas_edge =  new fabric.Line( coordinates, {
			
			fill: EDGE_BASE_COLOR,
			
			stroke: EDGE_BASE_COLOR,
			
			strokeWidth: 5,
			
			selectable: false,
			
		} );
		
		canvas_edge.setShadow( "0px 0px 10px rgba( 0, 0, 0, 0.7 )" );
		
		var text = new fabric.Text( label.toString( ), {
		
			left: ( coordinates[ 0 ] + coordinates[ 2 ] ) / 2,
			
			top:  ( coordinates[ 1 ] + coordinates[ 3 ] ) / 2,
		
			fontSize: 20,
			
			fontFamily: "Verdana, sans-serif",
			
			fill: "#fff",
			
			selectable: false
			
		} );
		
		text.setShadow( "0px 0px 5px rgba( 0, 0, 0, 0.9 )" );
		
		canvas.add( text );
		
		canvas_edge.edge_label = text;
		
		return canvas_edge;
		
	}
	
	window_height = window.innerHeight;
	window_width  = window.innerWidth;
	
	// Begin creating the graph nodes.
	// node[ i ].x
	// node[ i ].y
	// node[ i ].canvas_node
	// node[ i ].canvas_node.item( 0 ) /* Circle */
	// node[ i ].canvas_node.item( 1 ) /* Text   */
	// node[ i ].canvas_edges[ ]
	
	nodes = [ ];
	
	for ( i = 0; i < NUMBER_OF_NODES; ++i )
	{
	
		// Generate random canvas node coordinates.
		// X ranges from the left side of the screen to the right side of the screen.
		// Taking into account for the width of the node.
		// Y ranges from 70 to the bottom edge of the screen.
		// Taking into account for the height of the node.
		
		var node_coordinates = { x: random_float_in_range( ( NODE_RADIUS * 2 ) + NODE_STROKE_WIDTH, window_width  - ( NODE_RADIUS * 2 ) - NODE_STROKE_WIDTH ),
		                         y: random_float_in_range( 70,                                      window_height - ( NODE_RADIUS * 2 ) - NODE_STROKE_WIDTH )  };
		
		nodes.push( node_coordinates );
		
		var canvas_node = create_canvas_node( nodes[ i ].x, nodes[ i ].y, i );
		
		canvas.add( canvas_node );
		
		// Change the zIndex for this canvas node to one.
		// Canvas nodes will reside on zIndex 1 while
		// canvas edges will reside on zIndex 0.
		
		canvas_node.moveTo( 1 );
		
		nodes[ i ].canvas_node = canvas_node;
		
		nodes[ i ].canvas_edges = [ ];
	
	}
	
	for ( row = 0; row < NUMBER_OF_NODES; ++row )
	{
	
		for ( col = 0; col < NUMBER_OF_NODES; ++col )
		{
		
			if ( adjacency_matrix[ row ][ col ] != -1 )
			{
			
				var delta_x = nodes[ row ].x - nodes[ col ].x;
				var delta_y = nodes[ row ].y - nodes[ col ].y;
				
				var distance = Math.sqrt( ( delta_x * delta_x ) + ( delta_y * delta_y ) );
				
				adjacency_matrix[ row ][ col ] = distance;
				
				var distance = parseFloat( distance ).toFixed( 2 );
			
				var canvas_edge = create_canvas_edge( canvas, [ nodes[ row ].x, nodes[ row ].y, nodes[ col ].x, nodes[ col ].y ], distance );
				
				canvas.add( canvas_edge ); 
				
				canvas_edge.moveTo( 0 );
				
				nodes[ row ].canvas_edges.push( [ canvas_edge, "out", col ] );
				
				nodes[ col ].canvas_edges.push( [ canvas_edge, "in", row ] );
				
			}
			
		}
	
	}
	
	return nodes;

}

// Helper functions.

function random_float_in_range( minimum, maximum )
{

	return minimum + ( maximum - minimum ) * Math.random( );
	
}

function random_integer_in_range( minimum, maximum )
{

	return Math.floor( minimum + ( 1 + maximum - minimum ) * Math.random( ) );
	
}

function sleep( milliseconds ) 
{
	
	var start = new Date( ).getTime( );
	
	for ( var i = 0; i < 1e7; ++i ) 
	{
		
		if ( ( new Date( ).getTime( ) - start ) > milliseconds )
		{
		 	
		 	break;
		 	
		}
		
	}
	
}

// Create the begin/reset button but with it being initially hidden.

function create_button( )
{

	var button       = document.createElement( "div" );
	button.id        = "button";
	button.className = "button blue_background hidden";
	button.innerHTML = "Begin";
	document.body.appendChild( button );
	
}

// Dijkstra's shortest path algorithm that backtracks from the 
// TO node back to the FROM node outlining the nodes and paths in purple.

function shortest_path_algorithm( canvas, nodes, adjacency_matrix, node_from_selected_matrix_index, node_to_selected_matrix_index )
{

	// Implement a queue.
	
	function Queue( )
	{
		
		this.queue = [ ];
		
	}

	Queue.prototype.enqueue = function( item )
	{
		
		this.queue.push( item );
		
		this.queue.sort( function( a, b ) { return a.distances[ a.node ] - b.distances[ b.node ] } );
		
	}

	Queue.prototype.dequeue = function( )
	{
		
		this.queue.sort( function( a, b ) { return a.distances[ a.node ] - b.distances[ b.node ] } );
		
		return this.queue.shift( );
		
	}

	Queue.prototype.size = function( )
	{
		
		return this.queue.length;
		
	}

	Queue.prototype.peak = function( )
	{
		
		return ( this.queue[ 0 ] !== null ) ? this.queue[ 0 ] : null;
		
	}
	
	// Create an overlay that blocks the user from manipulating the canvas graph.
	
	var block            = document.createElement( "div" );
	block.id             = "block";
	block.innerHTML      = "&nbsp;";	
	block.style.position = "absolute";
	block.style.left     = "0px";
	block.style.top      = "0px";
	block.style.zIndex   = 4;
	document.body.appendChild( block );
	
	block.width        = window.innerWidth;
	block.height       = window.innerHeight;
	block.style.width  = window.innerWidth  + "px";
	block.style.height = window.innerHeight + "px";
	
	// Begin the algorithm.
	
	var distances    = [ ];
	var visited      = [ ];
	var predecessors = [ ];
	
	for ( var i = 0; i < NUMBER_OF_NODES; ++i )
	{
	
		distances.push( Number.MAX_VALUE );
		visited.push( 0 );
		predecessors.push( -1 );
		
		nodes[ i ].canvas_node.item( 0 ).set( { fill: NODE_NOT_VISITED_COLOR, stroke: NODE_NOT_VISITED_COLOR } );
		
		for ( var j = 0; j < nodes[ i ].canvas_edges.length; ++j )
		{
		
			nodes[ i ].canvas_edges[ j ][ 0 ].set( { fill: EDGE_NOT_VISITED_COLOR, stroke: EDGE_NOT_VISITED_COLOR } );
		
		}
		
	}
	
	distances[ node_from_selected_matrix_index ] = 0;
	
	var queue = new Queue( );
	
	queue.enqueue( { node: node_from_selected_matrix_index, distances: distances, visited: visited, predecessors: predecessors } );
	
	while ( queue.size( ) != 0 )
	{
		
		var u = queue.dequeue( );
		
		visited[ u.node ] = 1;
		
		nodes[ u.node ].canvas_node.item( 0 ).set( { fill: NODE_VISITED_COLOR, stroke: NODE_VISITED_COLOR } );
		
		for ( var v = 0; v < NUMBER_OF_NODES; ++v )
		{
		
			if ( adjacency_matrix[ u.node ][ v ] === -1 ) continue;
			
			var accumulated_shortest_distance = distances[ u.node ] + adjacency_matrix[ u.node ][ v ];
			
			if ( accumulated_shortest_distance < distances[ v ] )
			{
			
				distances[ v ] = accumulated_shortest_distance;
				
				predecessors[ v ] = u.node;
				
				if ( visited[ v ] != 1 )
				{
				
					queue.enqueue( { node: v, distances: distances, visited: visited, predecessors: predecessors } );
					
				}
			
			}
		
		}
		
	}
	
	var previous = predecessors[ node_to_selected_matrix_index ];
	
	if ( previous != -1 )
	{
		
		nodes[ node_to_selected_matrix_index ].canvas_node.item( 0 ).set( { fill: SHORTEST_PATH_EDGE_COLOR, stroke: SHORTEST_PATH_EDGE_COLOR } );

		var canvas_edge_index = -1;
		
		for ( var i = 0; i < nodes[ node_to_selected_matrix_index ].canvas_edges.length; ++i )
		{
		
			if ( nodes[ node_to_selected_matrix_index ].canvas_edges[ i ][ 2 ] === previous )
			{
			
				canvas_edge_index = i;
				
				break;
				
			}
			
		}
		
		if ( canvas_edge_index != -1 )
		{
		
			nodes[ node_to_selected_matrix_index ].canvas_edges[ canvas_edge_index ][ 0 ].set( { fill: SHORTEST_PATH_EDGE_COLOR, stroke: SHORTEST_PATH_EDGE_COLOR } );
			
		}
		
		while ( previous != -1 )
		{
		
			nodes[ previous ].canvas_node.item( 0 ).set( { fill: SHORTEST_PATH_EDGE_COLOR, stroke: SHORTEST_PATH_EDGE_COLOR } );
	
			var next = predecessors[ previous ];
			
			if ( next != -1 )
			{
			
				canvas_edge_index = -1;
		
				for ( var i = 0; i < nodes[ previous ].canvas_edges.length; ++i )
				{
		
					if ( nodes[ previous ].canvas_edges[ i ][ 2 ] === next )
					{
			
						canvas_edge_index = i;
				
						break;
				
					}
			
				}
		
				if ( canvas_edge_index != -1 )
				{
		
					nodes[ previous ].canvas_edges[ canvas_edge_index ][ 0 ].set( { fill: SHORTEST_PATH_EDGE_COLOR, stroke: SHORTEST_PATH_EDGE_COLOR } );
			
				}
			
			}
			
			previous = predecessors[ previous ];
		
		}
		
	}
	
	// Render the changes made to the canvas graph.
	
	canvas.renderAll( );
	
	// Change the begin/reset button to a reset button.
	
	var button       = document.getElementById( "button" );
	button.innerHTML = "Reset";
	button.className = "button red_background visible";
	button.onclick   = null;
	button.onclick   = function ( ) { reset( nodes ); };
	
	// Return the distances found from the FROM node.

	return distances;

}

// Reset the canvas graph.

function reset( nodes )
{

	for ( i = 0; i < NUMBER_OF_NODES; ++i )
	{
	
		nodes[ i ].canvas_node.item( 0 ).set( { fill: NODE_BASE_COLOR, stroke: NODE_BASE_COLOR } );
		
		for ( j = 0; j < nodes[ i ].canvas_edges.length; ++j )
		{
		
			nodes[ i ].canvas_edges[ j ][ 0 ].set( { fill: EDGE_BASE_COLOR, stroke: EDGE_BASE_COLOR } );
		
		}
		
	}
	
	canvas.renderAll( );
	
	node_from_selected_matrix_index = -1;
	node_to_selected_matrix_index   = -1;
	nodes_selected                  =  0;
	
	var button       = document.getElementById( "button" );
	button.innerHTML = "Begin";
	button.className = "button blue_background hidden";	
	button.onclick   = null;
	
	var block = document.getElementById( "block" );
	document.body.removeChild( block );
	
}

function create_loading_message( )
{

	var loading_background       = document.createElement( "div" );
	loading_background.id        = "loading_background";
	loading_background.className = "loading_background";
	loading_background.innerHTML = "&nbsp;"
	document.body.appendChild( loading_background );

	var loading_text        = document.createElement( "span" );
	loading_text.id         = "loading_text";
	loading_text.className  = "loading_text";
	loading_text.innerHTML  = "Loading...";	
	document.body.appendChild( loading_text );
	
	loading_text.style.left = ( window.innerWidth / 2  ) - ( loading_text.clientWidth / 2  ) + "px";
	loading_text.style.top  = ( window.innerHeight / 2 ) - ( loading_text.clientHeight / 2 ) + "px";
	
}

window.onload = initialize;

function initialize( )
{

	create_loading_message( );
	
	window.setTimeout( function ( ) {
	
		create_button( );
	
		var canvas_element    = document.createElement( "canvas" );
		canvas_element.width  = window.innerWidth;
		canvas_element.height = window.innerHeight;
		canvas_element.id     = "canvas";
		document.body.appendChild( canvas_element );
	
		canvas = new fabric.Canvas( "canvas", { selection: false, backgroundColor: "#333" } );
	
		fabric.Object.prototype.originX = fabric.Object.prototype.originY = "center";	
	
		var adjacency_matrix = create_adjacency_matrix( );
	
		var nodes = create_graph( canvas, adjacency_matrix );
	
		canvas.on( "object:selected", function( event ) {
	
			var canvas_node = event.target;
			
			var target_node_number = parseInt( canvas_node.item( 1 ).get( "text" ), 10 );
		
			nodes_selected += 1;			
		
			if ( nodes_selected === 3 )
			{
		
				nodes[ node_from_selected_matrix_index ].canvas_node.item( 0 ).set( { fill: NODE_BASE_COLOR, stroke: NODE_BASE_COLOR } );
			
				nodes[ node_to_selected_matrix_index ].canvas_node.item( 0 ).set( { fill: NODE_FROM_COLOR, stroke: NODE_FROM_COLOR } );
			
				node_from_selected_matrix_index = node_to_selected_matrix_index;
			
				node_to_selected_matrix_index = -1;
			
				nodes_selected = 2;

			}
	
			if ( nodes_selected === 1 && target_node_number != node_to_selected_matrix_index )
			{
		
				canvas_node.item( 0 ).set( { fill: NODE_FROM_COLOR, stroke: NODE_FROM_COLOR } );
			
				node_from_selected_matrix_index = target_node_number;

			}
			else if ( nodes_selected === 2 && target_node_number != node_from_selected_matrix_index )
			{
		
				canvas_node.item( 0 ).set( { fill: NODE_TO_COLOR, stroke: NODE_TO_COLOR } );
			
				node_to_selected_matrix_index = target_node_number;

			}
		
			if ( node_to_selected_matrix_index === -1 )
			{
		
				nodes_selected = 1;
				
			}
		
			var button = document.getElementById( "button" );
		
			if ( node_to_selected_matrix_index != -1 && node_from_selected_matrix_index != -1 )
			{
		
				button.className = "button blue_background visible";
				button.onclick   = function ( ) { 
					
					shortest_path_algorithm( canvas, nodes, adjacency_matrix, node_from_selected_matrix_index, node_to_selected_matrix_index ); 
					
				};
			
			}
			else
			{
		
				button.className = "button blue_background hidden";
				button.onclick   = null;
			
			}
			
			canvas.renderAll( );
	
		} );
	
		canvas.on( "object:moving" , function( event ) {

			var canvas_node = event.target;
			
			var target_node_number = parseInt( canvas_node.item( 1 ).get( "text" ), 10 );
		
			var node = nodes[ target_node_number ];
		
			node.x = canvas_node.get( "left" );
			node.y = canvas_node.get( "top"  );
		
			for ( i = 0; i < node.canvas_edges.length; ++i )
			{
		
				if ( node.canvas_edges[ i ][ 1 ] === "out" )
				{
			
					node.canvas_edges[ i ][ 0 ].set( { "x1": node.x, "y1": node.y } );
				
					var delta_x = node.canvas_edges[ i ][ 0 ].get( "x1" ) - node.canvas_edges[ i ][ 0 ].get( "x2" );
					var delta_y = node.canvas_edges[ i ][ 0 ].get( "y1" ) - node.canvas_edges[ i ][ 0 ].get( "y2" );
				
					var distance = Math.sqrt( ( delta_x * delta_x ) + ( delta_y * delta_y ) );
				
					adjacency_matrix[ target_node_number ][ node.canvas_edges[ i ][ 2 ] ] = distance;
					adjacency_matrix[ node.canvas_edges[ i ][ 2 ] ][ target_node_number ] = distance;
				
					distance = parseFloat( distance ).toFixed( 2 );
				
					node.canvas_edges[ i ][ 0 ].edge_label.set( { 
				
						left: ( node.canvas_edges[ i ][ 0 ].get( "x1" ) + node.canvas_edges[ i ][ 0 ].get( "x2" ) ) / 2,
						top:  ( node.canvas_edges[ i ][ 0 ].get( "y1" ) + node.canvas_edges[ i ][ 0 ].get( "y2" ) ) / 2,
						text: distance.toString( )
					
					} );
					
					node.canvas_edges[ i ][ 0 ].setCoords( );
				
				}
				else
				{
			
					node.canvas_edges[ i ][ 0 ].set( { "x2": node.x, "y2": node.y } );
				
					var delta_x = node.canvas_edges[ i ][ 0 ].get( "x1" ) - node.canvas_edges[ i ][ 0 ].get( "x2" );
					var delta_y = node.canvas_edges[ i ][ 0 ].get( "y1" ) - node.canvas_edges[ i ][ 0 ].get( "y2" );
				
					var distance = Math.sqrt( ( delta_x * delta_x ) + ( delta_y * delta_y ) );
				
					adjacency_matrix[ target_node_number ][ node.canvas_edges[ i ][ 2 ] ] = distance;
					adjacency_matrix[ node.canvas_edges[ i ][ 2 ] ][ target_node_number ] = distance;
				
					distance = parseFloat( distance ).toFixed( 2 );
				
					node.canvas_edges[ i ][ 0 ].edge_label.set( { 
				
						left: ( node.canvas_edges[ i ][ 0 ].get( "x1" ) + node.canvas_edges[ i ][ 0 ].get( "x2" ) ) / 2,
						top:  ( node.canvas_edges[ i ][ 0 ].get( "y1" ) + node.canvas_edges[ i ][ 0 ].get( "y2" ) ) / 2,
						text: distance.toString( )
					
					} );
					
					node.canvas_edges[ i ][ 0 ].setCoords( );
			
				}
		
			}
			
			node.canvas_node.setCoords( );
			
			canvas.renderAll( );

		} );
	
		document.body.removeChild( document.getElementById( "loading_background" ) );
		document.body.removeChild( document.getElementById( "loading_text" ) );
	
	}, 500 );

}
