/*
 * 
 * David Lettier (C) 2014.
 * 
 * http://www.lettier.com/
 * 
 * Renders a graph via a HTML5 canvas object.
 * 
 */

// Canvas primitives.

// Canvas shadow object.

function Shadow( parameters ) 
{
	
	this.type     = "shadow";
	this.id       = get_unique_integer( );
	
	this.color    = parameters.color;
	this.offset_x = parameters.offset_x;
	this.offset_y = parameters.offset_y;
	this.blur     = parameters.blur;	
	
}

Shadow.prototype.draw = function ( context ) {
		
	context.shadowColor   = this.color;
	context.shadowBlur    = this.blur;
	context.shadowOffsetX = this.offset_x;
	context.shadowOffsetY = this.offset_y;
		
};

// Canvas text object.

function Text( parameters ) 
{
	
	this.type    = "text";
	this.id      = get_unique_integer( );
	
	this.color   = parameters.color;
	this.x       = parameters.x;
	this.y       = parameters.y;
	this.font    = parameters.font_weight + " " + parameters.font_size + " " + parameters.font_family;
	this.height  = parseFloat( parameters.font_size );
	this.string  = parameters.string;
	this.shadow  = new Shadow( parameters.shadow );
	
}

Text.prototype.draw = function ( context ) {

	
		context.textAlign    = "left";
		context.textBaseLine = "middle";
		context.fillStyle    = this.color;
		context.font         = this.font;
		
		// Center text.
		
		var text_width = context.measureText( this.string ).width;
		
		this.x = this.x - ( text_width  / 2 );
		this.y = this.y + ( this.height / 2 );
		
		// Render the shadow then the text itself.
		
		this.shadow.draw( context );
		
		context.fillText( this.string, this.x, this.y );
		
};

// Canvas line object.

function Line( parameters )
{
	
	this.type       = "line";
	this.id         = get_unique_integer( ); 
	
	this.color      = parameters.color;
	this.x1         = parameters.x1;
	this.y1         = parameters.y1;
	this.x2         = parameters.x2;
	this.y2         = parameters.y2;
	this.width      = parameters.width;
	this.cap_style  = "round";
	this.shadow     = new Shadow( parameters.shadow );
	this.text       = new Text( parameters.text );
	
	this.circle_in  = null;
	this.circle_out = null;
	
}

Line.prototype.draw = function ( context ) {
	
	// Render a line emanating from one of its incident circles to the other.
	
	this.x1 = this.circle_out.x;
	this.y1 = this.circle_out.y;
	
	this.x2 = this.circle_in.x;
	this.y2 = this.circle_in.y;
	
	context.strokeStyle  = this.color;
	var line_width_cache = context.lineWidth;
	context.lineWidth    = this.width;
	var cap_style_cache  = context.lineCap;
	context.lineCap      = this.cap_style;
	
	context.beginPath( );
	context.moveTo( this.x1, this.y1 );
	context.lineTo( this.x2, this.y2 );
	
	// Render the line's shadow.
	
	this.shadow.draw( context );
	
	context.stroke( );
	
	// Restore line width and cap style.
	
	context.lineWidth = line_width_cache;
	context.lineCap   = cap_style_cache;
	
	// Center the line's text based on the position of its incident circles.
	
	if ( this.x1 <= this.x2 )
	{
	
		this.text.x = this.x1 + ( Math.abs( this.x2 - this.x1 ) / 2 );
		
	}
	else
	{
		
		this.text.x = this.x2 + ( Math.abs( this.x1 - this.x2 ) / 2 );
		
	}
		
	if ( this.y1 <= this.y2 )
	{
	
		this.text.y = this.y1 + ( Math.abs( this.y2 - this.y1 ) / 2 );
		
	}
	else
	{
		
		this.text.y = this.y2 + ( Math.abs( this.y1 - this.y2 ) / 2 );
		
	}
	
};	

function Circle( parameters )
{
	
	this.type      = "circle";
	this.id        = get_unique_integer( );
	
	this.color     = parameters.color;
	this.radius    = parameters.radius;
	
	this.diameter  = this.radius * 2;
	
	this.x         = parameters.x;
	this.y         = parameters.y;
	this.shadow    = new Shadow( parameters.shadow );
	this.text      = new Text( parameters.text );
	
	this.lines_in  = [ ];
	this.lines_out = [ ];
	
}

Circle.prototype.draw = function ( context ) {
	
	context.fillStyle = this.color;
	
	context.beginPath( );
	
	// 6.283185307179586 = 2PI
	
	context.arc( this.x, this.y, this.radius, 0, 6.283185307179586 );
	
	this.shadow.draw( context );
	
	context.fill( );
	
	context.closePath( );
	
	// Center text with this circle.
	
	this.text.x = this.x;
	this.text.y = this.y;
	
	this.text.draw( context );
	
};

Circle.prototype.add_line_in = function ( line ) {
	
	// Add an incident line.
	
	line.x2 = this.x;
	line.y2 = this.y;
	
	line.circle_in = this;
	
	this.lines_in.push( line );
	
}

Circle.prototype.add_line_out = function ( line ) {
	
	// Add an incident line.
	
	line.x1 = this.x;
	line.y1 = this.y;
	
	line.circle_out = this;
	
	this.lines_out.push( line );
	
}

Circle.prototype.point_in = function ( x, y ) {
	
	// Calculate whether a point lies within and on this circle.
	
	var math_abs = Math.abs;
	
	var  r = this.radius;		
	var dx = math_abs( x - this.x );
	var dy = math_abs( y - this.y );
	
	var dx2 = dx * dx;
	var dy2 = dy * dy;
	var  r2 =  r *  r;
	
	if ( ( dx2 + dy2 ) <= r2 ) { return true; }
	else { return false; }
	
}

// Canvas handler object.

function Canvas_Handler( parameters )
{
	
	this.canvas  = parameters.canvas;
	this.context = parameters.context;
	
	this.canvas_invalid = false;
	
	this.mouse_coordinates = null;
	
	this.dragging = false;
	
	this.circle_dragging = null;
	
	this.dragging_target_x = null;
	this.dragging_target_y = null;
	
	this.mouse_offset_x = null;
	this.mouse_offset_y = null;
	
	this.dragging_timer_id = null;
	
	this.dragging_timer_then = 0;
	
	this.handle_dragging_timer = this.on_dragging_timer_tick.bind( this );
	
	this.circles = [ ];
	this.lines   = [ ];
	
	this.line_ids = { };
	
	this.texts = [ ];
	
	this.text_ids = { };
	
	this.handle_mouse_down = this.on_mouse_down.bind( this );
	this.handle_mouse_up   = this.on_mouse_up.bind(   this );
	this.handle_mouse_move = this.on_mouse_move.bind( this );
	
	this.canvas.addEventListener( "mousedown", this.handle_mouse_down, false );
	this.canvas.addEventListener( "mouseup",   this.handle_mouse_up,   false );
	this.canvas.addEventListener( "mousemove", this.handle_mouse_move, false );
	
}

Canvas_Handler.prototype.draw_all = function ( ) {
	
	// If the canvas is not invalid, avoid redrawing.
	
	if ( !this.canvas_invalid ) return null;
	
	this.context.clearRect( this.canvas.offsetLeft, this.canvas.offsetTop, 
					    this.canvas.width,      this.canvas.height     );
	
	// First render the lines.
	
	var i = this.lines.length;
	
	while ( i-- )
	{
		
		this.lines[ i ].draw( this.context );
		
	}
	
	// Then render the texts.
	
	i = this.texts.length;
	
	while ( i-- )
	{
		
		this.texts[ i ].draw( this.context );
		
	}
	
	// This render the circles.
	
	i = this.circles.length;
	
	while ( i-- )
	{
		
		this.circles[ i ].draw( this.context );
		
	}
	
	// The canvas is now up-to-date.
	
	this.canvas_invalid = false;
	
};

Canvas_Handler.prototype.add_circle = function ( circle ) {
	
	// Add a circle to the graph handler's data structure.
	
	// At the same time, unroll this circle's incidental lines and
	// add them to the graph handler's data structure making sure
	// not to add a duplicate line that was previously added.
	
	this.circles.push( circle );
	
	var i = circle.lines_in.length;
	
	while ( i-- )
	{
		
		if ( typeof( this.line_ids[ circle.lines_in[ i ].id ] ) === "undefined" )
		{
			
			this.lines.push( circle.lines_in[ i ] );
			
			this.line_ids[ circle.lines_in[ i ].id ] = this.lines.length - 1;
			
		}
		
		if ( typeof( this.text_ids[ circle.lines_in[ i ].text.id ] ) === "undefined" )
		{
			
			this.texts.push( circle.lines_in[ i ].text );
			
			this.text_ids[ circle.lines_in[ i ].text.id ] = this.texts.length - 1;
			
		}
		
	}
	
	i = circle.lines_out.length;
	
	while ( i-- )
	{
		
		if ( typeof( this.line_ids[ circle.lines_out[ i ].id ] ) === "undefined" )
		{
			
			this.lines.push( circle.lines_out[ i ] );
			
			this.line_ids[ circle.lines_out[ i ].id ] =  this.lines.length - 1;
			
		}
		
		if ( typeof( this.text_ids[ circle.lines_out[ i ].text.id ] ) === "undefined" )
		{
			
			this.texts.push( circle.lines_out[ i ].text );
			
			this.text_ids[ circle.lines_out[ i ].text.id ] =  this.texts.length - 1;
			
		}
		
	}
	
	/*
	
	if ( typeof( circle.text ) != "undefined" )
	{
	
		if ( typeof( this.text_ids[ circle.text.id ] ) === "undefined" )
		{
			
			this.texts.push( circle.text );
			
			this.text_ids[ circle.text.id ] = this.texts.length - 1;
			
		}
		
	}
	
	*/
	
	// Since a new circle has been added the canvas needs a redraw.
	
	this.canvas_invalid = true;
	
};

Canvas_Handler.prototype.update_id_lookups = function ( ) {
	
	// Maintain the lookup objects with the correct array positions
	// for both the lines and texts arrays.
	
	var i = this.lines.length;
	
	while ( i-- )
	{
		
		this.line_ids[ this.lines[ i ].id ] = i;
		
	}
	
	i = this.texts.length;
	
	while ( i-- )
	{
		
		this.text_ids[ this.texts[ i ].id ] = i;
		
	}

};

Canvas_Handler.prototype.get_mouse_coordinates = function ( x, y ) {
	
	// Translate the mouse coordinates relative to the canvas coordinates.
	
	var canvas_rectangle = this.canvas.getBoundingClientRect( );
	
	return {
		
		x: x - canvas_rectangle.left,
		y: y - canvas_rectangle.top
		
	};
	
};

Canvas_Handler.prototype.point_in_circle = function ( x, y ) {
	
	// Given a point (x,y), find the first circle (if any) on the canvas
	// that contains this point.
	
	// Returns -1 if no circle contains this given point.
	
	var i = this.circles.length;
	
	var circle_index = -1;
	
	while ( i-- )
	{
		
		if ( this.circles[ i ].type != "circle" ) continue;
		
		if ( this.circles[ i ].point_in( x, y ) )
		{
			
			circle_index = i;
			
			break;
			
		}
		
	}
	
	return circle_index;
	
};

Canvas_Handler.prototype.on_dragging_timer_tick = function ( ) {
	
	// While a circle is being dragged, interpolate the circle's position between
	// its current position and the mouse's current position or the target position.
	// This creates a smoother transition effect.
	
	// Maintain the mouse's offset from the circle's local origin.
	
	var math_abs = Math.abs;
	
	var dx = math_abs( this.circle_dragging.x - this.dragging_target_x );
	var dy = math_abs( this.circle_dragging.y - this.dragging_target_y );
	
	this.canvas_invalid = true;
	
	if ( !this.dragging && dx < 3 && dy < 3 )
	{
		
		// If the circle is within a small distance from the target, snap it to the target.
		
		this.circle_dragging.x = this.dragging_target_x;
		this.circle_dragging.y = this.dragging_target_y;
		
		// Alert subscribers that the circle is no longer being dragged or in other words,
		// it has reached its target position as specified by the mouse.
		
		var custom_event = new CustomEvent( "dragging:stopped", {
			
			detail: { 
				
				circle: this.circle_dragging
				
			},
			bubles: true,
			cancelable: false
			
		} );
		
		this.canvas.dispatchEvent( custom_event );
		
		// Since the mouse button may have been released before the circle made its way
		// to its target position, check if the mouse is currently over a circle in order
		// to update the cursor appropriately.
		
		var circle_index = this.point_in_circle( this.mouse_coordinates.x, this.mouse_coordinates.y );
		
		if ( circle_index != -1 )
		{
			
			this.canvas.style.cursor = "pointer";
			
		}
		else
		{
			
			this.canvas.style.cursor = "default";
			
		}
		
		// Reset the dragging parameters.
		
		this.circle_dragging = null;
		
		this.mouse_offset_x = null;
		this.mouse_offset_y = null;
		
		this.dragging_target_x = null;
		this.dragging_target_y = null;
		
		// Clear the interval that continuously interpolated the circle's position.
		
		clearInterval( this.dragging_timer_id );
		
		// Reset the interval ID parameter.
		
		this.dragging_timer_id = null;
		
	}
	else
	{
		
		// The circle has not yet reached the last known mouse position while the mouse button was down.
		// Continue interpolating the circle's position.
		
		// var now = Date.now( );
		
		// var time_delta = ( now - this.dragging_timer_then ) / 1000;
		
		this.circle_dragging.x = this.circle_dragging.x + ( 0.6 * ( this.dragging_target_x - this.circle_dragging.x ) );
		this.circle_dragging.y = this.circle_dragging.y + ( 0.6 * ( this.dragging_target_y - this.circle_dragging.y ) );
		
		// this.dragging_timer_then = now;
		
		// Alert subscribers that the circle is still being dragged.
		
		var custom_event = new CustomEvent( "dragging:continuing", {
			
			detail: { 
				
				circle: this.circle_dragging
				
			},
			bubles: true,
			cancelable: false
			
		} );
		
		this.canvas.dispatchEvent( custom_event );
		
	}
	
};

Canvas_Handler.prototype.on_mouse_move = function ( event ) {
	
	// While the mouse is moving, keep track of its coordinates relative to the canvas.
	// Update the cursor if the mouse is over a circle or not over a circle.
	// Alert subscribers if the mouse is over a circle.
	// Alert subscribers if the mouse is not over a circle.
	
	this.mouse_coordinates = this.get_mouse_coordinates( event.clientX, event.clientY );
	
	if ( this.dragging )
	{
		
		// If the mouse is moving while the mouse button is being held or really if a circle
		// is still interpolating to its target position (that is, it is still being dragged),
		// update the dragging target taking into consideration the mouse's offset to the 
		// circle's local origin.
		
		this.canvas.style.cursor = "move";
		
		this.canvas_invalid = true;
		
		this.dragging_target_x = this.mouse_coordinates.x - this.mouse_offset_x;
		this.dragging_target_y = this.mouse_coordinates.y - this.mouse_offset_y;
		
		return null;
		
	}
	
	var circle_index = this.point_in_circle( this.mouse_coordinates.x, this.mouse_coordinates.y );
	
	if ( circle_index != -1 )
	{

		this.canvas.style.cursor = "pointer";
		
		var custom_event = new CustomEvent( "mouse:over", {
			
			detail: { 
				
				circle: this.circles[ circle_index ]
				
			},
			bubles: true,
			cancelable: false
			
		} );
		
		this.canvas.dispatchEvent( custom_event );
		
	}
	else
	{
		
		this.canvas.style.cursor = "default";
		
		var custom_event = new CustomEvent( "mouse:out", {
			
			detail: {
				
			},
			bubles: true,
			cancelable: false
			
		} );
		
		this.canvas.dispatchEvent( custom_event );
		
	}
	
}

Canvas_Handler.prototype.on_mouse_down = function ( event ) {
	
	// When the user presses the mouse button, check if the current mouse coordinates
	// are over a circle. If they are, begin the dragging sequence.
	
	// Note that at any time, only one circle may be dragged.
	// In other words, a circle that was dragged previously must reach its target position
	// before another circle can begin being dragged.
	
	this.mouse_coordinates = this.get_mouse_coordinates( event.clientX, event.clientY );
	
	var circle_index = this.point_in_circle( this.mouse_coordinates.x, this.mouse_coordinates.y );
	
	if ( circle_index != -1 && this.dragging_timer_id === null )
	{
		
		this.canvas.style.cursor = "move";
		
		this.canvas_invalid = true;
		
		this.dragging = true;
		
		this.circle_dragging = this.circles[ circle_index ];
		
		// Bring the circle and its incident lines to the foreground.
		
		this.circles.unshift( this.circles.splice( circle_index, 1 )[ 0 ] );
		
		var i = this.circle_dragging.lines_out.length;
		
		while ( i-- )
		{
			
			var line_index = this.line_ids[ this.circle_dragging.lines_out[ i ].id ];
			
			this.lines.unshift( this.lines.splice( line_index, 1 )[ 0 ] );
			
			var text_index = this.text_ids[ this.circle_dragging.lines_out[ i ].text.id ];
			
			this.texts.unshift( this.texts.splice( text_index, 1 )[ 0 ] );
			
			this.update_id_lookups( );
			
		}
		
		i = this.circle_dragging.lines_in.length;
		
		while ( i-- )
		{
			
			var line_index = this.line_ids[ this.circle_dragging.lines_in[ i ].id ];
			
			this.lines.unshift( this.lines.splice( line_index, 1 )[ 0 ] );
			
			var text_index = this.text_ids[ this.circle_dragging.lines_in[ i ].text.id ];
			
			this.texts.unshift( this.texts.splice( text_index, 1 )[ 0 ] );
			
			this.update_id_lookups( );
			
		}
		
		// Calculate the offset between the mouse coordinates and the circle's local origin.
		
		this.mouse_offset_x = this.mouse_coordinates.x - this.circle_dragging.x;
		this.mouse_offset_y = this.mouse_coordinates.y - this.circle_dragging.y;
		
		this.dragging_target_x = this.mouse_coordinates.x - this.mouse_offset_x;
		this.dragging_target_y = this.mouse_coordinates.y - this.mouse_offset_y;
		
		// Interpolate the circle's position at roughly 60 times per second.
		
		this.dragging_timer_id = setInterval( this.handle_dragging_timer, 1000 / 16.666666667 );
		
		// Alert subscribers that the user has started dragging a circle.

		var custom_event = new CustomEvent( "dragging:started", {
			
			detail: { 
				
				circle: this.circle_dragging
				
			},
			bubles: true,
			cancelable: false
			
		} );
		
		this.canvas.dispatchEvent( custom_event );
		
	}
	
	this.canvas.style.cursor = "move";
	
};

Canvas_Handler.prototype.on_mouse_up = function ( event ) {
	
	// The user has released the mouse button but the circle they were dragging
	// may have not yet reached its target position. If this the case,
	// update the target position. This will be the last known target position
	// that the circle's position must be interpolated to.
	
	this.mouse_coordinates = this.get_mouse_coordinates( event.clientX, event.clientY );
	
	var circle_index = this.point_in_circle( this.mouse_coordinates.x, this.mouse_coordinates.y );
	
	if ( this.dragging )
	{
		
		this.canvas.style.cursor = "move";
		
		this.canvas_invalid = true;
		
		this.dragging_target_x = this.mouse_coordinates.x - this.mouse_offset_x;
		this.dragging_target_y = this.mouse_coordinates.y - this.mouse_offset_y;
		
		this.dragging = false;
		
	}
	
	if ( circle_index != -1 )
	{
	
		this.canvas.style.cursor = "pointer";
		
	}
	else
	{
		
		this.canvas.style.cursor = "default";
		
	}
	
};

// Graph primitives.

function Edge( parameters )
{
	this.type      = "edge";
	this.id        = get_unique_integer( );
	
	this.weight    = parameters.label;
	
	this.node_out  = null;
	this.node_in   = null;
	
}

Edge.prototype.set_node_out = function ( node ) {
	
	if ( this.node_out === null )
	{
		
		this.node_out = node;
		
	}
	
};

Edge.prototype.set_node_in = function ( node ) {
	
	if ( this.node_in === null )
	{
		
		this.node_in = node;
		
	}
	
};

function Node( parameters )
{
	
	this.type      = "node";
	this.id        = get_unique_integer( );
	
	this.x         = parameters.x;
	this.y         = parameters.y;
	
	this.label     = parameters.label;
	
	this.edges_out = [ ];
	this.edges_in  = [ ];	
	
}

Node.prototype.add_edge_out = function ( edge ) {
	
	this.edges_out.push( edge );
	
};

Node.prototype.add_edge_in = function ( edge ) {
	
	this.edges_in.push( edge );
	
};

Node.prototype.update_edges = function ( ) {
	
	// Recalculate edge weights.
	
	var i = this.edges_out.length;
	
	while ( i-- )
	{
		
		var edge = this.edges_out[ i ];
		
		var dx = this.edges_out[ i ].node_out.x - this.edges_out[ i ].node_in.x;
		dx2    = dx * dx;
		var dy = this.edges_out[ i ].node_out.y - this.edges_out[ i ].node_in.y;
		dy2    = dy * dy;
		
		var distance = Math.sqrt( dx2 + dy2 );
		
		edge.weight = distance;
		
	}
	
	i = this.edges_in.length;
	
	while ( i-- )
	{
		
		var edge = this.edges_in[ i ];
		
		var dx = this.edges_in[ i ].node_out.x - this.edges_in[ i ].node_in.x;
		dx2    = dx * dx;
		var dy = this.edges_in[ i ].node_out.y - this.edges_in[ i ].node_in.y;
		dy2    = dy * dy;
		
		var distance = Math.sqrt( dx2 + dy2 );
		
		edge.weight = distance;
		
	}
	
};

// Graph handler object.

function Graph_Handler( parameters )
{
	
	this.number_of_nodes  = parameters.number_of_nodes;
	
	this.node_location_bounds = parameters.node_location_bounds;
	
	this.adjacency_matrix = [ ];
	
	this.edges            = [ ];
	this.nodes            = [ ];
	
	this.populate_nodes( );
	
	this.connect_graph( );
	
}

Graph_Handler.prototype.populate_nodes = function ( )
{
	
	// Generate the nodes of the graph at random locations.
	
	for ( var i = 0; i < this.number_of_nodes; ++i )
	{
		
		var x = get_random_integer( this.node_location_bounds.x1, this.node_location_bounds.x2 );
		var y = get_random_integer( this.node_location_bounds.y1, this.node_location_bounds.y2 );
		
		var node = new Node( { x: x, y: y, label: i } );
		
		this.nodes.push( node );
		
	}
	
}

Graph_Handler.prototype.connect_graph = function (  ) {
	
	// Generate the adjacency matrix.
	
	// M[i][j] = -1 indicates that edge {i,j} does not exist.
	
	for ( var i = 0; i < this.number_of_nodes; ++i )
	{
		
		var row = [ ];
		
		for ( var j = 0; j < this.number_of_nodes; ++j )
		{
			
			row.push( -1 );
			
		}
		
		this.adjacency_matrix.push( row );
		
	}
	
	// Generate random connectivity in the graph.
	// Iterate through the matrix above the diagonal.
	
	for ( var i = 0; i < this.number_of_nodes; ++i )
	{
		
		for ( var j = i + 1; j < this.number_of_nodes; ++j )
		{
			
			if ( get_random_integer( 0, 2 ) === 1 )
			{
				
				var dx = this.nodes[ i ].x - this.nodes[ j ].x;
				dx2    = dx * dx;
				var dy = this.nodes[ i ].y - this.nodes[ j ].y;
				dy2    = dy * dy;

				var distance = Math.sqrt( dx2 + dy2 );
				
				var edge = new Edge( { weight: distance } );
				
				edge.set_node_out( this.nodes[ i ] );
				edge.set_node_in(  this.nodes[ j ] );
				
				this.nodes[ i ].add_edge_out( edge );
				this.nodes[ j ].add_edge_in(  edge );
				
				this.edges.push( edge );
				
				this.adjacency_matrix[ i ][ j ] = distance;
				this.adjacency_matrix[ j ][ i ] = distance;
				
			}
			
		}
		
	}
	
};

Graph_Handler.prototype.update_adjacency_matrix = function ( )
{
	
	// Update the adjacency matrix based on adjacent node distances.

	var i = this.edges.length;
	
	while ( i-- )
	{
		
		var node_out = this.edges[ i ].node_out;
		var node_in  = this.edges[ i ].node_in;
		
		var dx = node_out.x - node_in.x;
		dx2    = dx * dx;
		var dy = node_out.y - node_in.y;
		dy2    = dy * dy;
		
		var distance = Math.sqrt( dx2 + dy2 );
		
		this.adjacency_matrix[ node_out.label ][ node_in.label  ] = distance;
		this.adjacency_matrix[ node_in.label  ][ node_out.label ] = distance;
		
	}
	
};

// Helper functions.

var get_unique_integer = ( function ( ) {
	
	// Returns an internal (hidden/private) integer that is incremented each function call.
	
	var __increment = 0;

	return function ( ) {
		
		__increment += 1;
		
		return __increment;
		
	};
	
} ) ( );

function get_random_integer( min, max ) 
{
	
	return Math.floor( Math.random( ) * ( max - min + 1 ) + min );
	
}

function get_clamped_value( value, min, max )
{
	
	if ( value > max ) value = max;
	if ( value < min ) value = min;
	
	return value;
	
}