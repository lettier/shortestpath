/*
 * 
 * David Lettier (C) 2014.
 * 
 * http://www.lettier.com/
 * 
 * Computes the shortest path from a user chosen source node to
 * a user chosen terminal node utilizing Dijkstra's algorithm.
 * 
 */

function on_load( )
{

	// Constants.
	
	var NUMBER_OF_NODES = 10;
	
	var NODE_RADIUS = 28;
	
	var NODE_DEFAULT_COLOR = "#1FB4FF";
	var EDGE_DEFAULT_COLOR = "#fb2";	
	
	var SHORTEST_PATH_COLOR     = "#BC69F0";	
	var NOT_SHORTEST_PATH_COLOR = "#D0C7D6";
	
	var NODE_VISITED_COLOR     = "#555";
	var NODE_NOT_VISITED_COLOR = "#D0C7D6";
	
	var STARTING_NODE_COLOR = "#28ED56";
	var ENDING_NODE_COLOR   = "#FF3D44";
	
	// Node selection.
	
	var starting_node = null;
	var ending_node   = null;
	
	var nodes_selected = 0;
	
	// Create and show an onscreen logo.
	
	var logo_box        = document.createElement( "div" );
	logo_box.id         = "logo_box";
	logo_box.title      = "Lettier";
	logo_box.className  = "logo_box";
	logo_box.innerHTML  = "<img id='logo' src='assets/images/logo.png' class='logo' onclick='window.open(\"http://www.lettier.com/\");'>";
	document.body.appendChild( logo_box );
	
	var logo_image          = document.getElementById( "logo" );
	logo_image_height       = logo_image.clientHeight * 0.5;
	logo_image_width        = logo_image.clientWidth  * 0.5;
	logo_image.style.height = logo_image_height + "px";
	logo_image.style.width  = logo_image_width  + "px";
	logo_box.style.top      = window.innerHeight - logo_image_height - 10 + "px";
	logo_box.style.left     = window.innerWidth  - logo_image_width  - 10 + "px";
	
	// Create and show a button that allows for the creation
	// of a new graph without having to reloading the page.
	
	var new_graph_button       = document.createElement( "div" );
	new_graph_button.id        = "new_graph_button";
	new_graph_button.className = "button purple_background visible";
	new_graph_button.innerHTML = "New Graph";
	document.body.appendChild( new_graph_button );
	
	new_graph_button.onclick = function ( event ) {
		
		event.preventDefault( );
		
		try
		{
			
			document.body.removeChild( document.getElementById( "overlay" ) );
			
		} catch ( error ) { }
		
		document.body.removeChild( canvas );
		
		document.body.removeChild( begin_reset_button );
		
		document.body.removeChild( new_graph_button );
		
		logo_box.removeChild( logo_image );
		
		document.body.removeChild( logo_box );
		
		on_load( );
		
	}
	
	new_graph_button.addEventListener( "selectstart", function( event ) { 
		
		event.preventDefault( ); 
		
		return false; 
		
	}, false );
	
	// This button begins the path search and then turns into reset button that sets the canvas graph 
	// back to the way it was before the path search.
	
	var begin_reset_button       = document.createElement( "div" );
	begin_reset_button.id        = "begin_reset_button";
	begin_reset_button.className = "button green_background hidden";
	begin_reset_button.innerHTML = "Begin";
	document.body.appendChild( begin_reset_button );
	
	begin_reset_button.style.left = new_graph_button.offsetLeft + new_graph_button.clientWidth + 10 + "px";
	
	begin_reset_button.addEventListener( "selectstart", function( event ) { 
		
		event.preventDefault( ); 
		
		return false; 
		
	}, false );
	
	// Create and show the canvas.
	
	var canvas           = document.createElement( "canvas" );
	canvas.innerHTML     = "Your browser does not support HTML5 canvas.";
	canvas.id            = "canvas";
	canvas.width         = window.innerWidth;
	canvas.height        = window.innerHeight;
	canvas.style.width   = window.innerWidth + "px";
	canvas.style.height  = window.innerHeight + "px";
	canvas.style.margin  = "0px";
	canvas.style.padding = "0px";
	document.body.appendChild( canvas );
	
	// Get the 2D canvas context.
	
	var context = canvas.getContext( "2d" );
	
	// Create the canvas and graph handlers.
	
	var canvas_handler = new Canvas_Handler( { canvas: canvas, context: context } );
	
	var graph_handler  = new Graph_Handler( { 
		
		number_of_nodes: NUMBER_OF_NODES,
		node_location_bounds: {
			
			x1: NODE_RADIUS * 2,
			x2: window.innerWidth  - ( NODE_RADIUS * 2 ),
			y1: 80 + NODE_RADIUS,
			y2: window.innerHeight - 180 - NODE_RADIUS
			
		}
		
	} );
	
	// Shadow parameters for all canvas elements.
	
	var shadow_parameters = {
		
		color: "rgba( 1, 1, 1, 0.9 )",
		offset_x: 0,
		offset_y: 0,
		blur: 15
		
	};
	
	// Generate the canvas circles and lines that represent that graph.
	
	var circles = { };
		
	for ( var i = 0; i < graph_handler.number_of_nodes; ++i )
	{
		
		// Do not add duplicate circles to the canvas.
		
		if ( typeof( circles[ graph_handler.nodes[ i ].id ] ) === "undefined" )
		{
			
			var circle = new Circle( {
		
				color: NODE_DEFAULT_COLOR,
				radius: NODE_RADIUS,
				x: graph_handler.nodes[ i ].x,
				y: graph_handler.nodes[ i ].y,
				shadow: shadow_parameters,
				text: {
					
					color: "#fff",
					x: graph_handler.nodes[ i ].x,
					y: graph_handler.nodes[ i ].y,
					font_weight: "bold",
					font_size: "20pt",
					font_family: "monospace",
					string: graph_handler.nodes[ i ].label,
					shadow: shadow_parameters
					
				}
				
			} );
			
			circles[ graph_handler.nodes[ i ].id ] = circle;
			
		}
		
		for ( var j = i + 1; j < graph_handler.number_of_nodes; ++j )
		{
			
			if ( graph_handler.adjacency_matrix[ i ][ j ] != -1 )
			{
				
				if ( typeof( circles[ graph_handler.nodes[ j ].id ] ) === "undefined" )
				{
					
					var circle = new Circle( {
				
						color: NODE_DEFAULT_COLOR,
						radius: NODE_RADIUS,
						x: graph_handler.nodes[ j ].x,
						y: graph_handler.nodes[ j ].y,
						shadow: shadow_parameters,
						text: {
							
							color: "#fff",
							x: graph_handler.nodes[ j ].x,
							y: graph_handler.nodes[ j ].y,
							font_weight: "bold",
							font_size: "20pt",
							font_family: "monospace",
							string: graph_handler.nodes[ j ].label,
							shadow: shadow_parameters
							
						}
						
					} );
					
					circles[ graph_handler.nodes[ j ].id ] = circle;
					
				}
				
				var c1 = circles[ graph_handler.nodes[ i ].id ];
				var c2 = circles[ graph_handler.nodes[ j ].id ];
				
				// Get the distance between this circle and its neighbor.
				
				var line_string = parseFloat( graph_handler.adjacency_matrix[ i ][ j ].toFixed( 2 ) );
				
				// Generate the lines that represents the edge.
				
				var line = new Line( {
		
					color: EDGE_DEFAULT_COLOR,
					x1: c1.x,
					y1: c1.y,
					x2: c2.x,
					y2: c2.y,
					width: 10,
					shadow: shadow_parameters,
					text: {
						
						color: "#fff",
						x: 0,
						y: 0,
						font_weight: "bold",
						font_size: "15pt",
						font_family: "monospace",
						string: line_string,
						shadow: {
		
							color: "rgba( 1, 1, 1, 1.0 )",
							offset_x: 0,
							offset_y: 0,
							blur: 5

						}
						
					}
					
				} );
				
				// Add this line to the circles' data structures.
				
				c1.add_line_out( line );
				c2.add_line_in(  line );
				
			}
			
		}
		
	}
	
	// Add the circles created the canvas handler's data structure. 
	
	var i = 0;
	
	for ( key in circles )
	{
		
		canvas_handler.add_circle( circles[ key ] );
		
		i += 1;
		
	}
	
	// Make sure no circle was erroneously skipped.
	
	if ( i != NUMBER_OF_NODES )
	{
		
		console.warn( "Number of circles does not equal number of nodes." );
		console.log( i, NUMBER_OF_NODES );
		
	}
	
	// Begin Dijkstra's algorithm.
	
	function shortest_path_algorithm( parameters )
	{

		// Implement a queue.
		
		function Queue( )
		{
			
			this.queue = [ ];
			
		}

		Queue.prototype.enqueue = function( item )
		{
			
			this.queue.push( item );
			
			// Sort the queue based on the nodes' distances.
			
			this.queue.sort( function( a, b ) { return a.distances[ a.node.label ] - b.distances[ b.node.label ] } );
			
		}

		Queue.prototype.dequeue = function( )
		{
			
			this.queue.sort( function( a, b ) { return a.distances[ a.node.label ] - b.distances[ b.node.label ] } );
			
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
		
		// Create an overlay that blocks the user from manipulating the canvas.
		
		var overlay            = document.createElement( "div" );
		overlay.id             = "overlay";
		overlay.innerHTML      = "&nbsp;";	
		overlay.style.position = "absolute";
		overlay.style.left     = "0px";
		overlay.style.top      = "0px";
		overlay.style.zIndex   = 1;
		document.body.appendChild( overlay );
		
		overlay.width        = window.innerWidth;
		overlay.height       = window.innerHeight;
		overlay.style.width  = window.innerWidth  + "px";
		overlay.style.height = window.innerHeight + "px";
		
		// Get the circles and the lines from the canvas handler.
		
		var circles = parameters.canvas_handler.circles;
		var lines   = parameters.canvas_handler.lines;
		
		// This will provide a convenient circle lookup object.
		
		var circle_lookup = { };
		
		// Gather pertinent elements from the graph handler.

		var number_of_nodes  = parameters.graph_handler.nodes.length;
		var nodes            = parameters.graph_handler.nodes;
		var adjacency_matrix = parameters.graph_handler.adjacency_matrix;
		
		// Get the source node and the terminal node.
		
		var starting_node    = parameters.starting_node;
		var ending_node      = parameters.ending_node;
		
		graph_handler.update_adjacency_matrix( );
		
		// Begin the algorithm.
		
		var distances    = [ ];
		var visited      = [ ];
		var predecessors = [ ];
		
		var i = circles.length;
		
		while ( i-- )
		{
		
			distances.push( Number.MAX_VALUE );
			visited.push( 0 );
			predecessors.push( -1 );
			
			// Color the circles appropriately.
			
			circles[ i ].color = NODE_NOT_VISITED_COLOR;
			
			// Populate the circle lookup object.
			
			if ( typeof( circle_lookup[ circles[ i ].text.string ] ) === "undefined" )
			{
				
				circle_lookup[ circles[ i ].text.string ] = circles[ i ];
				
			}
			
		}
		
		i = lines.length;
		
		while ( i-- )
		{
			
			// Color the lines appropriately.
			
			lines[ i ].color = NOT_SHORTEST_PATH_COLOR;
			
		}
		
		// Canvas objects' colors have change so flag the canvas as invalid for redrawing.
		
		parameters.canvas_handler.canvas_invalid = true;
		
		// Distance from the source node to itself if of course zero.
		
		distances[ starting_node.label ] = 0;
		
		// Create the queue that will hold the nodes not yet visited where
		// the queue is a priority queue such that the priority is the node's
		// current shortest distance from the source node.
		
		var queue = new Queue( );
		
		// Add the source node first.
		
		queue.enqueue( { node: starting_node, distances: distances } );
		
		// Continue while there are still nodes to visit.
		
		while ( queue.size( ) != 0 )
		{
			
			// Get from the queue the node with the shortest distance.
			
			var u = queue.dequeue( );
			
			// Mark this node as having been visited.
			
			visited[ u.node.label ] = 1;
			
			// Look up this node's circle representation and color it visited.
			
			circle_lookup[ u.node.label ].color = NODE_VISITED_COLOR;
			
			// Redraw canvas.
			
			parameters.canvas_handler.canvas_invalid = true;
			
			// Visit all of the graph's nodes.
			
			for ( var v = 0; v < number_of_nodes; ++v )
			{
			
				// If the edge {u,v} does not exist, continue.
				// Note that the adjacency matrix holds the adjacent distances
				// between node i and node j.
				// So if an edge {i,j} exists, then 0 <= M[i][j] <= infinity
				// otherwise M[i][j] = -1.
				
				if ( adjacency_matrix[ u.node.label ][ v ] === -1 ) continue;
				
				// Accumulate the distance from the source node, through u, to this current node v.
				
				var accumulated_shortest_distance = distances[ u.node.label ] + adjacency_matrix[ u.node.label ][ v ];
				
				// If the accumulated distance from s through u to v is less than v's current distance.
				
				if ( accumulated_shortest_distance < distances[ v ] )
				{
				
					// Update v's distance from the source node.
					
					distances[ v ] = accumulated_shortest_distance;
					
					// Set v's previous or predecessor node as u.
					
					predecessors[ v ] = u.node;
					
					// If v hasn't been visited before.
					
					if ( visited[ v ] != 1 )
					{
					
						// Add v to the queue to be visited later on.
						
						queue.enqueue( { 
							
							node: nodes[ v ], 
							distances: distances, 
						
						} );
						
					}
				
				}
			
			}
			
		}
		
		// All the shortest distances from the source node to all the other nodes in the graph
		// have been calculated.
		
		// Now back track from the terminal node to the source node all the while 
		// coloring the shortest path on the canvas from the terminal node back to the 
		// source node if possible. That is, if there exists a path from terminal to
		// source.
		// (s)<---()<---()..?..(p)<---(t)
		
		// At first, set the current node as the terminal node.
		
		var current_node = ending_node;
		
		// Get the current node's previous or predecessor node if it exists.
		// (s)...(p)<---(c)
		
		var predecessor_node = predecessors[ current_node.label ];
		
		if ( predecessor_node != -1 )
		{
		
			// Get the current node's circle representation on the canvas.
			// Color it to indicate it is apart of the shortest path from 
			// the source node to the terminal node and redraw the canvas.
			
			var current_circle = circle_lookup[ current_node.label ];
			
			current_circle.color = SHORTEST_PATH_COLOR;
			
			parameters.canvas_handler.canvas_invalid = true;	
			
			// Color the predecessor circle as part of the shortest path.
			
			var predecessor_circle = circle_lookup[ predecessor_node.label ];
			
			// Find the line on the canvas that represents the edge
			// between the current node and its predecessor node in the shortest path.
			// {c,p}
			
			i = current_circle.lines_out.length;
			
			while ( i-- )
			{
				
				var line = current_circle.lines_out[ i ];
				
				if ( line.circle_in.text.string  === predecessor_circle.text.string ||
					line.circle_out.text.string === predecessor_circle.text.string )
				{
					
					line.color = SHORTEST_PATH_COLOR;
					
					parameters.canvas_handler.canvas_invalid = true;	
					
					break;
					
				}
				
			}
			
			i = current_circle.lines_in.length;
			
			while ( i-- )
			{
				
				var line = current_circle.lines_in[ i ];
				
				if ( line.circle_in.text.string  === predecessor_circle.text.string ||
					line.circle_out.text.string === predecessor_circle.text.string )
				{
					
					line.color = SHORTEST_PATH_COLOR;
					
					parameters.canvas_handler.canvas_invalid = true;	
					
					break;
					
				}
				
			}
			
			// Now the current node, its edge to its predecessor, and the predecessor node have
			// been colored.
			
			// Make the current node the predecessor node.
			
			current_node = predecessor_node;
			
			// Get this new current node's predecessor node is it exists.
				
			predecessor_node = predecessors[ current_node.label ];
			
			while ( predecessor_node != -1 )
			{

				// Color the current node.
				
				current_circle = circle_lookup[ current_node.label ];
			
				current_circle.color = SHORTEST_PATH_COLOR;
				
				parameters.canvas_handler.canvas_invalid = true;
				
				// Color the predecessor node.
				
				predecessor_circle = circle_lookup[ predecessor_node.label ];
				
				// Color the edge {c,p}.
				
				i = current_circle.lines_out.length;
				
				while ( i-- )
				{
					
					var line = current_circle.lines_out[ i ];
					
					if ( line.circle_in.text.string  === predecessor_circle.text.string ||
						line.circle_out.text.string === predecessor_circle.text.string    )
					{
						
						line.color = SHORTEST_PATH_COLOR;
						
						parameters.canvas_handler.canvas_invalid = true;
						
						break;
						
					}
					
				}
				
				i = current_circle.lines_in.length;
				
				while ( i-- )
				{
					
					var line = current_circle.lines_in[ i ];
					
					if ( line.circle_in.text.string  === predecessor_circle.text.string ||
						line.circle_out.text.string === predecessor_circle.text.string    )
					{
						
						line.color = SHORTEST_PATH_COLOR;
						
						parameters.canvas_handler.canvas_invalid = true;
						
						break;
						
					}
					
				}
				
				// Update current as the predecessor.
				
				current_node = predecessor_node;
				
				// Get the new predecessor if it exists.
				
				predecessor_node = predecessors[ current_node.label ];
			
			}
			
			// If there exists a path from terminal to source then the 
			// current node traced back to at this point will be the source node.
			// Test if this is true and if it is the case then
			// color the starting node as part of the shortest path.
			
			if ( current_node.label === starting_node.label )
			{
				
				current_circle = circle_lookup[ current_node.label ];
			
				current_circle.color = SHORTEST_PATH_COLOR;
				
				parameters.canvas_handler.canvas_invalid = true;
				
			}
			
		}
		
		// Change the begin/reset button to a reset button.
		
		var begin_reset_button       = document.getElementById( "begin_reset_button" );
		begin_reset_button.innerHTML = "Reset";
		begin_reset_button.className = "button red_background visible";
		begin_reset_button.onclick   = null;
		begin_reset_button.onclick   = reset;

		return distances;

	}
	
	// Reset the canvas graph.

	function reset( )
	{

		var circles = canvas_handler.circles;
		var lines   = canvas_handler.lines;
		
		var i = circles.length;
		
		while( i-- )
		{
		
			circles[ i ].color = NODE_DEFAULT_COLOR;
			
		}
		
		i = lines.length;
		
		while( i-- )
		{
			
			lines[ i ].color = EDGE_DEFAULT_COLOR;
			
		}
		
		starting_node = null;
		ending_node   = null;
		
		nodes_selected = 0;
		
		var begin_reset_button       = document.getElementById( "begin_reset_button" );
		begin_reset_button.innerHTML = "Begin";
		begin_reset_button.className = "button green_background hidden";	
		begin_reset_button.onclick   = null;
		
		var overlay = document.getElementById( "overlay" );
		document.body.removeChild( overlay );
		
		canvas_handler.canvas_invalid = true;
		
	}
	
	// This function handles the dragging events dispatched from the canvas handler.
	
	function dragging_udpate( event )
	{
		
		// Get the current circle that is being dragged
		// and update the corresponding node's and the 
		// graph handler's data structure.
		
		var circle = event.detail.circle;
		
		var node = graph_handler.nodes[ parseInt( circle.text.string, 10 ) ];
		
		node.x = circle.x;
		node.y = circle.y;
		
		// Update this node's edge weights.
		
		node.update_edges( );
		
		graph_handler.update_adjacency_matrix( );
		
		var i = node.edges_out.length;
		
		// Set the lines' text to the new euclidean pixel distance.
		
		while ( i-- )
		{
			
			circle.lines_out[ i ].text.string = parseFloat( node.edges_out[ i ].weight.toFixed( 2 ) );
			
		}
		
		i = node.edges_in.length;
		
		while ( i-- )
		{
			
			circle.lines_in[ i ].text.string = parseFloat( node.edges_in[ i ].weight.toFixed( 2 ) );
			
		}
		
	}
	
	// Prevent the canvas from being highlighted.
	
	canvas.addEventListener( "selectstart", function( event ) { 
		
		event.preventDefault( ); 
		
		return false; 
		
	}, false );
	
	// A circle has stated dragging.
	
	canvas.addEventListener( "dragging:started", function ( event ) {
		
		// Handle the circle dragging by updating the canvas and the graph.
		
		dragging_udpate( event );
		
		// The following logic deals with highlighting the source
		// and terminal nodes for use in the shortest path algorithm function.
		
		// No more than two nodes can be selected at once.
		
		// The first node to be selected in sequence is the source node while
		// the second node to be selected in sequence is the terminal node.
		
		var circle = event.detail.circle;
		
		if ( nodes_selected === 0 )
		{
			
			circle.color = STARTING_NODE_COLOR;
			
			starting_node = graph_handler.nodes[ parseInt( circle.text.string, 10 ) ];
			
			nodes_selected = 1;
			
		}
		else if ( nodes_selected === 1 )
		{
			
			try
			{
				circles[ ending_node.id   ].color = NODE_DEFAULT_COLOR;
				
			} catch ( error ) { }
			
			circle.color = ENDING_NODE_COLOR;
			
			ending_node = graph_handler.nodes[ parseInt( circle.text.string, 10 ) ];
			
			nodes_selected = 2;
			
		}
		else if ( nodes_selected === 2 )
		{
			
			try
			{
				circles[ starting_node.id ].color = NODE_DEFAULT_COLOR;
				
			} catch ( error ) { }
			
			try
			{
				circles[ ending_node.id   ].color = NODE_DEFAULT_COLOR;
				
			} catch ( error ) { }
			
			circle.color = STARTING_NODE_COLOR;
			
			starting_node = graph_handler.nodes[ parseInt( circle.text.string, 10 ) ];
			
			ending_node = null;
			
			nodes_selected = 1;
			
		}
		
		if ( ending_node != null && starting_node.id === ending_node.id )
		{
			
			try
			{
				circles[ starting_node.id ].color = NODE_DEFAULT_COLOR;
				
			} catch ( error ) { }
			
			try
			{
				circles[ ending_node.id   ].color = NODE_DEFAULT_COLOR;
				
			} catch ( error ) { }
			
			circle.color = STARTING_NODE_COLOR;
			
			starting_node = graph_handler.nodes[ parseInt( circle.text.string, 10 ) ];
			ending_node   = null;
			
			nodes_selected = 1;
			
		}
		
		var begin_reset_button = document.getElementById( "begin_reset_button" );
		
		// If both a source and terminal node have been selected, show the
		// begin button.
		
		if ( starting_node != null && ending_node != null )
		{
		
			begin_reset_button.className = "button green_background visible";
			
			var shortest_path_parameters = {
				
				canvas_handler: canvas_handler,
				graph_handler: graph_handler,
				starting_node: starting_node,
				ending_node: ending_node
				
			};
			
			begin_reset_button.onclick = function ( ) { 
				
				shortest_path_algorithm( shortest_path_parameters ); 
				
			};
			
		}
		else
		{

			begin_reset_button.className = "button green_background hidden";
			begin_reset_button.onclick   = null;
		
		}
		
	}, false );
	
	// A circle is being continuously dragged.
	
	canvas.addEventListener( "dragging:continuing", function ( event ) {
		
		dragging_udpate( event );
		
	}, false );
	
	// A circle has stopped being dragged.
	
	canvas.addEventListener( "dragging:stopped", function ( event ) {
		
		dragging_udpate( event );
		
	}, false );
	
	// Re-size onscreen elements if the browser window has changed.
	
	window.onresize = function ( event ) {
		
		var logo_image          = document.getElementById( "logo" );
		logo_image_height       = logo_image.clientHeight;
		logo_image_width        = logo_image.clientWidth;
		logo_image.style.height = logo_image_height + "px";
		logo_image.style.width  = logo_image_width  + "px";
		logo_box.style.top      = window.innerHeight - logo_image_height - 10 + "px";
		logo_box.style.left     = window.innerWidth  - logo_image_width  - 10 + "px";
		
		canvas.width        = window.innerWidth;
		canvas.height       = window.innerHeight;
		canvas.style.width  = canvas.width + "px";
		canvas.style.height = canvas.height + "px";
		
		canvas_handler.canvas_invalid = true;
		
		canvas_handler.draw_all( );
		
	}
	
	// Render the canvas at roughly 60 FPS.
	
	function render( timestamp )
	{
		
		requestAnimationFrame( render );
		
		canvas_handler.draw_all( );
		
	}
	
	// Browser compatibility.
	
	var requestAnimationFrame = window.requestAnimationFrame       || window.mozRequestAnimationFrame ||
                                 window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
						   
	// Begin rendering.
							 
	requestAnimationFrame( render );
	
}