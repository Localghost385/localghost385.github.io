<script lang="ts">
	import { onMount } from 'svelte';

	// define a grid of cells and a grid of points, each cell is a group of 4 points in a square, cells overlap
	class point {
		x: number;
		y: number;

		value: number = 0;
		constructor(x: number, y: number) {
			this.x = x;
			this.y = y;
		}
		updateValue(metaballs: metaball[]) {
			this.value = metaballs.reduce((acc, mb) => acc + mb.calculateInfluence(this.x, this.y), 0);
		}
	}
	class cell {
		points: point[];
		constructor(points: point[]) {
			this.points = points;
		}
	}

	class grid {
		points: point[][];
		cells: cell[][];

		constructor(width: number, height: number, cellSize: number) {
			this.points = [];
			this.cells = [];

			// Initialize points
			for (let x = 0; x < width; x += cellSize) {
				this.points[x] = [];
				for (let y = 0; y < height; y += cellSize) {
					this.points[x][y] = new point(x, y);
				}
			}

			// Initialize cells
			for (let x = 0; x < width - cellSize; x += cellSize) {
				this.cells[x] = [];
				for (let y = 0; y < height - cellSize; y += cellSize) {
					this.cells[x][y] = new cell([
						this.points[x][y],
						this.points[x + cellSize][y],
						this.points[x + cellSize][y + cellSize],
						this.points[x][y + cellSize]
					]);
				}
			}
		}
		draw() {
			this.points.forEach((row) => {
				row.forEach((point) => {
					ctx.beginPath();
					//draw a cross at the point
					ctx.moveTo(point.x - cellSize / 4, point.y);
					ctx.lineTo(point.x + cellSize / 4, point.y);
					ctx.moveTo(point.x, point.y - cellSize / 4);
					ctx.lineTo(point.x, point.y + cellSize / 4);

					ctx.stroke();
				});
			});
		}
	}
	class metaball {
		calculateInfluence(x: number, y: number) {
			return Math.pow(this.radius, 2) / (Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2) + 1);
		}
		x: number;
		y: number;
		dx: number;
		dy: number;
		radius: number;
		value: number;
		constructor(x: number, y: number, radius: number, value: number, dx: number, dy: number) {
			this.x = x;
			this.y = y;
			this.radius = radius;
			this.value = value;
			this.dx = dx;
			this.dy = dy;
		}
		update() {
			this.x += this.dx;
			this.y += this.dy;

			// Ensure metaball stays within the bounds of the canvas
			if (this.x - this.radius < 0 || this.x + this.radius > width) {
				this.dx = -this.dx;
			}
			if (this.y - this.radius < 0 || this.y + this.radius > height) {
				this.dy = -this.dy;
			}
		}
	}

	function createMetaballs(
		count: number,
		maxWidth: number,
		maxHeight: number,
		maxRadius: number,
		maxValue: number
	) {
		const newMetaballs = [];
		for (let i = 0; i < count; i++) {
			const x = Math.random() * maxWidth;
			const y = Math.random() * maxHeight;
			const radius = Math.random() * maxRadius;
			const value = Math.random() * maxValue;
			const dx = Math.random() * 5 - 1;
			const dy = Math.random() * 5 - 1;
			newMetaballs.push(new metaball(x, y, radius, value, dx, dy));
		}
		return newMetaballs;
	}

	let canvas: HTMLCanvasElement;
	let ctx: any;
	//set width and height to the viewport width and height
	let width = 1600;
	let height = 900;

	let cellSize = 6;

	function marchingSquares(cells: any[], threshold: number) {
		cells.forEach((cellRow: any[]) => {
			cellRow.forEach((cell: { points: any[] }) => {
				let index = 0;
				if (cell.points[0].value < threshold) index |= 1;
				if (cell.points[1].value < threshold) index |= 2;
				if (cell.points[2].value < threshold) index |= 4;
				if (cell.points[3].value < threshold) index |= 8;

				ctx.beginPath();
				if (index === 1 || index === 14) {
					ctx.moveTo(cell.points[0].x + cellSize / 2, cell.points[0].y); //correct
					ctx.lineTo(cell.points[0].x, cell.points[0].y + cellSize / 2);
				} else if (index === 2 || index === 13) {
					ctx.moveTo(cell.points[1].x, cell.points[1].y + cellSize / 2); //correct
					ctx.lineTo(cell.points[1].x - cellSize / 2, cell.points[1].y);
				} else if (index === 3 || index === 12) {
					ctx.moveTo(cell.points[0].x, cell.points[0].y + cellSize / 2); //correct
					ctx.lineTo(cell.points[1].x, cell.points[1].y + cellSize / 2);
				} else if (index === 4 || index === 11) {
					ctx.moveTo(cell.points[2].x, cell.points[2].y - cellSize / 2); //correct
					ctx.lineTo(cell.points[2].x - cellSize / 2, cell.points[2].y);
				} else if (index === 6 || index === 9) {
					ctx.moveTo(cell.points[0].x + cellSize / 2, cell.points[0].y); //correct
					ctx.lineTo(cell.points[3].x + cellSize / 2, cell.points[3].y);
				} else if (index === 7 || index === 8) {
					ctx.moveTo(cell.points[3].x, cell.points[3].y - cellSize / 2); //correct
					ctx.lineTo(cell.points[3].x + cellSize / 2, cell.points[3].y);
				} else if (index === 5) {
				}
				ctx.strokeStyle = '#b4befe';
				ctx.lineWidth = 2;
				ctx.stroke();
			});
		});
	}

	onMount(() => {
		// set up ctx
		ctx = canvas.getContext('2d');
		let canvas_grid = new grid(width, height, cellSize);
		let metaballs: metaball[] = createMetaballs(18, width, height, 75, 10);
		// Store the previous state of metaballs
		let prevMarchingSquaresState: string | null = null;

		function animate() {
			let marchingSquaresChanged = false;

			// Update and draw metaballs
			metaballs.forEach((ball) => {
				ball.update();
			});

			// Update grid points' values and draw red squares if value is above threshold
			canvas_grid.points.forEach((row) => {
				row.forEach((point) => {
					point.updateValue(metaballs);
				});
			});

			// Check if the marching squares lines have changed
			const currentMarchingSquaresState = JSON.stringify(canvas_grid.cells);
			if (currentMarchingSquaresState !== prevMarchingSquaresState) {
				prevMarchingSquaresState = currentMarchingSquaresState;
				marchingSquaresChanged = true;
			}

			// Clear the canvas if either the metaballs or marching squares lines have changed
			if (marchingSquaresChanged) {
				ctx.clearRect(0, 0, width, height); // Clear the canvas
			}

			// Draw marching squares lines if they have changed
			if (marchingSquaresChanged) {
				marchingSquares(canvas_grid.cells, 0.2);
			}

			requestAnimationFrame(animate);
		}

		// Start the animation loop
		requestAnimationFrame(animate);
	});

	let searchTerm = '';

	let input: HTMLInputElement;
	onMount(() => {
		input.focus();
	});

	function performSearch() {
		const searchUrl = `https://www.duckduckgo.com/?q=${encodeURIComponent(searchTerm)}`;
		window.open(searchUrl, '_blank');
	}

	let links = [
		{
			title: 'Array 1',
			children: [
				{ url: 'http://reddit.com', name: 'reddit' },
				{ url: 'http://youtube.com', name: 'youtube' },
				{ url: 'http://twitch.tv', name: 'twitch' }
			]
		},
		{
			title: 'Array 2',
			children: [
				{ url: 'http://github.com/', name: 'github' },
				{ url: 'http://devdocs.io', name: 'devdocs' },
				{ url: 'http://stackoverflow.com', name: 'stackoverflow' },
				{ url: 'http://wikipedia.org', name: 'wikipedia' }

			]
		},
		{
			title: 'Array 3',
			children: [
				{ url: 'http://gmail.com', name: 'gmail' },
				{ url: 'http://drive.google.com', name: 'drive' },
				{ url: 'http://classroom.google.com', name: 'classroom' }
			]
		},
		{
			title: 'Array 4',
			children: [
				{ url: 'http://monkeytype.com', name: 'monkeytype' },
				// { url: 'http://', name: '' }
			]
		}
	];
</script>

<div class="main_content">
	<div class="logo">
		<div class="logo_outline" />
		<svg
			width="77.009758"
			height="80.346542"
			version="1.1"
			viewBox="0 0 77.00976 80.346541"
			class="logo_img"
		>
			<title id="title1">Firefox Browser logo</title>
			<defs id="defs66" />
			<path
				d="m 73.762732,27.701162 c -1.653661,-3.979001 -5.00812,-8.275182 -7.634928,-9.633266 a 39.544508,39.544508 0 0 1 3.854289,11.548135 l 0.0069,0.06383 C 65.685911,18.956591 58.391732,14.626041 52.431087,5.2088109 52.129618,4.7325485 51.828149,4.2553041 51.534536,3.7515462 51.366616,3.4638248 51.232085,3.2045809 51.115228,2.9659587 a 6.9259353,6.9259353 0 0 1 -0.567586,-1.5073459 0.09819843,0.09819843 0 0 0 -0.08642,-0.098198 0.13551383,0.13551383 0 0 0 -0.07168,0 c -0.0049,0 -0.01277,0.00884 -0.01866,0.010802 -0.0059,0.00196 -0.01866,0.010802 -0.0275,0.01473 l 0.01473,-0.025532 C 40.798501,6.9577249 37.553043,17.31766 37.258448,22.502537 A 19.040676,19.040676 0 0 0 26.780676,26.539474 11.381198,11.381198 0 0 0 25.798691,25.79513 17.646258,17.646258 0 0 1 25.691655,16.492793 28.182949,28.182949 0 0 0 16.530723,23.5729 h -0.01767 C 15.00472,21.660976 15.110774,15.356637 15.197189,14.039796 a 6.8031872,6.8031872 0 0 0 -1.270688,0.674623 27.711597,27.711597 0 0 0 -3.719756,3.186539 33.230349,33.230349 0 0 0 -3.5577294,4.268686 v 0.0059 -0.0069 A 32.140346,32.140346 0 0 0 1.5426972,33.697158 l -0.051063,0.251388 c -0.071685,0.334856 -0.3299467,2.012086 -0.374136,2.376402 0,0.02848 -0.00589,0.05499 -0.00884,0.08347 A 36.2745,36.2745 0 0 0 0.490992,41.655159 v 0.196396 a 38.061711,38.061711 0 0 0 75.563692,6.435926 c 0.06383,-0.490993 0.115874,-0.977075 0.172829,-1.472977 A 39.141894,39.141894 0 0 0 73.758804,27.69527 Z M 29.897494,57.494565 c 0.177739,0.08543 0.344676,0.177739 0.527325,0.259244 l 0.02651,0.01669 Q 30.174409,57.637931 29.89749,57.494561 Z M 38.61555,34.535772 m 31.374399,-4.84511 v -0.03633 l 0.0069,0.04026 z"
				fill="url(#a)"
				id="path66"
				style="fill:none;stroke:#b4befe;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 73.762732,27.701162 c -1.653661,-3.979001 -5.00812,-8.275182 -7.634928,-9.633266 a 39.544508,39.544508 0 0 1 3.854289,11.548135 v 0.03633 l 0.0069,0.04026 A 34.467649,34.467649 0 0 1 68.804694,55.381335 C 64.442719,64.740627 53.888352,74.333632 37.361556,73.86228 19.509082,73.356558 3.7776935,60.10468 0.84156036,42.753017 c -0.53518141,-2.73679 0,-4.124334 0.26906374,-6.348528 a 28.359707,28.359707 0 0 0 -0.61177623,5.251652 v 0.196396 A 38.061711,38.061711 0 0 0 76.06254,48.288463 c 0.06383,-0.490993 0.115874,-0.977075 0.172829,-1.472977 A 39.141894,39.141894 0 0 0 73.76666,27.696252 Z"
				fill="url(#b)"
				id="path67"
				style="fill:none;stroke:#b4befe;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 73.762732,27.701162 c -1.653661,-3.979001 -5.00812,-8.275182 -7.634928,-9.633266 a 39.544508,39.544508 0 0 1 3.854289,11.548135 v 0.03633 l 0.0069,0.04026 A 34.467649,34.467649 0 0 1 68.804694,55.381335 C 64.442719,64.740627 53.888352,74.333632 37.361556,73.86228 19.509082,73.356558 3.7776935,60.10468 0.84156036,42.753017 c -0.53518141,-2.73679 0,-4.124334 0.26906374,-6.348528 a 28.359707,28.359707 0 0 0 -0.61177623,5.251652 v 0.196396 A 38.061711,38.061711 0 0 0 76.06254,48.288463 c 0.06383,-0.490993 0.115874,-0.977075 0.172829,-1.472977 A 39.141894,39.141894 0 0 0 73.76666,27.696252 Z"
				fill="url(#c)"
				id="path68"
				style="fill:none;stroke:#b4befe;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 55.262148,32.16919 c 0.08249,0.05794 0.159082,0.115874 0.236658,0.173811 A 20.719869,20.719869 0 0 0 51.963663,27.732585 C 40.130752,15.899674 48.863538,2.0831549 50.335533,1.3761261 l 0.01473,-0.021604 C 40.790646,6.951833 37.545187,17.311768 37.250592,22.496645 c 0.443857,-0.03044 0.883786,-0.06776 1.337463,-0.06776 a 19.207613,19.207613 0 0 1 16.674093,9.738338 z"
				fill="url(#d)"
				id="path69"
				style="fill:none;stroke:#b4befe;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 38.607694,34.535772 c -0.06285,0.946633 -3.407485,4.211731 -4.577028,4.211731 -10.821467,0 -12.579219,6.546889 -12.579219,6.546889 0.479208,5.51286 4.320731,10.05552 8.964534,12.451561 0.212109,0.109983 0.427164,0.209163 0.642218,0.306379 q 0.558749,0.24746 1.117498,0.457605 a 16.929409,16.929409 0 0 0 4.952147,0.955471 C 56.099781,60.355086 59.772402,36.78157 46.082559,29.93714 a 13.13895,13.13895 0 0 1 9.176643,2.228122 19.207613,19.207613 0 0 0 -16.674093,-9.738338 c -0.451713,0 -0.893606,0.03731 -1.337463,0.06776 a 19.040676,19.040676 0 0 0 -10.477772,4.036937 c 0.580352,0.490993 1.235336,1.146958 2.615024,2.507006 2.582619,2.544322 9.206103,5.179967 9.220832,5.489293 z"
				fill="url(#e)"
				id="path70"
				style="fill:none;stroke:#b4befe;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 38.607694,34.535772 c -0.06285,0.946633 -3.407485,4.211731 -4.577028,4.211731 -10.821467,0 -12.579219,6.546889 -12.579219,6.546889 0.479208,5.51286 4.320731,10.05552 8.964534,12.451561 0.212109,0.109983 0.427164,0.209163 0.642218,0.306379 q 0.558749,0.24746 1.117498,0.457605 a 16.929409,16.929409 0 0 0 4.952147,0.955471 C 56.099781,60.355086 59.772402,36.78157 46.082559,29.93714 a 13.13895,13.13895 0 0 1 9.176643,2.228122 19.207613,19.207613 0 0 0 -16.674093,-9.738338 c -0.451713,0 -0.893606,0.03731 -1.337463,0.06776 a 19.040676,19.040676 0 0 0 -10.477772,4.036937 c 0.580352,0.490993 1.235336,1.146958 2.615024,2.507006 2.582619,2.544322 9.206103,5.179967 9.220832,5.489293 z"
				fill="url(#f)"
				id="path71"
				style="fill:none;stroke:#cba6f7;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="M 0.83468646,42.754981 C 3.7718016,60.106644 19.502208,73.363432 37.354682,73.864244 53.881478,74.331668 64.437809,64.737682 68.79782,55.383299 A 34.467649,34.467649 0 0 0 69.982093,29.69459 v -0.03633 c 0,-0.02848 -0.0059,-0.04517 0,-0.03633 l 0.0069,0.06383 c 1.350228,8.815273 -3.133512,17.351663 -10.143898,23.13555 l -0.0216,0.0491 c -13.659401,11.125882 -26.729612,6.710881 -29.37115,4.909922 q -0.27692,-0.132568 -0.553839,-0.275938 C 21.935565,53.698214 18.644936,46.447242 19.351964,40.221461 a 9.7736897,9.7736897 0 0 1 -9.015598,-5.670959 14.35661,14.35661 0 0 1 13.993277,-0.561695 18.952297,18.952297 0 0 0 14.287871,0.561695 C 38.602784,34.241177 31.9793,31.604549 29.396682,29.06121 28.016994,27.701162 27.36201,27.046178 26.781658,26.554204 A 11.381198,11.381198 0 0 0 25.799673,25.80986 C 25.573817,25.655688 25.319483,25.488751 25.014086,25.288426 22.238016,23.483539 16.7173,23.58272 16.534651,23.587629 h -0.01768 c -1.508328,-1.911923 -1.402274,-8.216262 -1.315859,-9.533103 a 6.8031872,6.8031872 0 0 0 -1.270688,0.674623 27.711597,27.711597 0 0 0 -3.719757,3.186539 33.230349,33.230349 0 0 0 -3.5724582,4.258866 v 0.0059 -0.0069 A 32.140346,32.140346 0 0 0 1.5318954,33.702068 c -0.018658,0.07758 -1.37085013,5.989122 -0.70408274,9.054877 z"
				fill="url(#h)"
				id="path73"
				style="fill:none;stroke:#fab387;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 51.962681,27.730621 a 20.719869,20.719869 0 0 1 3.535143,4.615326 c 0.209163,0.1581 0.404578,0.315217 0.570533,0.467425 8.628696,7.954073 4.107641,19.197793 3.77082,19.9932 C 66.848581,47.031523 71.328393,38.489241 69.983075,29.671022 65.678056,18.937934 58.37602,14.607383 52.425196,5.1901532 52.123726,4.7138908 51.822257,4.2366464 51.528644,3.7328885 51.360725,3.4451671 51.226193,3.1859232 51.109337,2.947301 a 6.9259353,6.9259353 0 0 1 -0.567587,-1.5073459 0.09819843,0.09819843 0 0 0 -0.08641,-0.098198 0.13551383,0.13551383 0 0 0 -0.07169,0 c -0.0049,0 -0.01277,0.00884 -0.01866,0.010802 -0.0059,0.00196 -0.01866,0.010802 -0.02749,0.01473 -1.471995,0.6981908 -10.202817,14.5235477 1.630094,26.3466387 z"
				fill="url(#i)"
				id="path74"
				style="fill:none;stroke:#f9e2af;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 56.067375,32.8173 c -0.165955,-0.152208 -0.36137,-0.309325 -0.570533,-0.467425 -0.07758,-0.05794 -0.154171,-0.115874 -0.236658,-0.173811 a 13.13895,13.13895 0 0 0 -9.176643,-2.228122 c 13.688861,6.84443 10.01624,30.412054 -8.954715,29.528268 A 16.929409,16.929409 0 0 1 32.176679,58.520739 Q 31.61793,58.311576 31.059181,58.063134 c -0.215054,-0.0982 -0.430109,-0.196397 -0.642218,-0.306379 l 0.02651,0.01669 c 2.645466,1.805869 15.711749,6.217924 29.37115,-4.909922 l 0.0216,-0.0491 c 0.340749,-0.795407 4.861804,-12.039127 -3.77082,-19.9932 z"
				fill="url(#j)"
				id="path75"
				style="fill:none;stroke:#f9e2af;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 21.452429,45.2885 c 0,0 1.75677,-6.546889 12.579219,-6.546889 1.169543,0 4.517127,-3.265098 4.577028,-4.211731 a 18.952297,18.952297 0 0 1 -14.287871,-0.561695 14.35661,14.35661 0 0 0 -13.993276,0.561695 9.7736897,9.7736897 0 0 0 9.015597,5.67096 c -0.705064,6.222834 2.584583,13.472824 10.546512,17.282924 0.177739,0.08543 0.344676,0.177739 0.527325,0.259243 -4.647731,-2.400951 -8.485326,-6.941647 -8.964534,-12.451561 z"
				fill="url(#k)"
				id="path76"
				style="fill:none;stroke:#f9e2af;stroke-width:0.981984;stroke-opacity:1"
			/>
			<path
				d="m 73.762732,27.701162 c -1.653661,-3.979001 -5.00812,-8.275182 -7.634928,-9.633266 a 39.544508,39.544508 0 0 1 3.854289,11.548135 l 0.0069,0.06383 C 65.685911,18.956591 58.391732,14.626041 52.431087,5.2088109 52.129618,4.7325485 51.828149,4.2553041 51.534536,3.7515462 51.366616,3.4638248 51.232085,3.2045809 51.115228,2.9659587 a 6.9259353,6.9259353 0 0 1 -0.567586,-1.5073459 0.09819843,0.09819843 0 0 0 -0.08642,-0.098198 0.13551383,0.13551383 0 0 0 -0.07168,0 c -0.0049,0 -0.01277,0.00884 -0.01866,0.010802 -0.0059,0.00196 -0.01866,0.010802 -0.0275,0.01473 l 0.01473,-0.025532 C 40.798501,6.9577249 37.553043,17.31766 37.258448,22.502537 c 0.443857,-0.03044 0.883786,-0.06776 1.337463,-0.06776 a 19.207613,19.207613 0 0 1 16.674093,9.738338 13.13895,13.13895 0 0 0 -9.176643,-2.228122 c 13.688861,6.84443 10.01624,30.412054 -8.954715,29.528268 A 16.929409,16.929409 0 0 1 32.186499,58.517793 Q 31.62775,58.30863 31.069001,58.060188 c -0.215055,-0.0982 -0.430109,-0.196397 -0.642218,-0.306379 l 0.02651,0.01669 q -0.27692,-0.132568 -0.553839,-0.275938 c 0.177739,0.08543 0.344676,0.177739 0.527325,0.259244 -4.647731,-2.401933 -8.485326,-6.942629 -8.964534,-12.451561 0,0 1.756769,-6.546889 12.579218,-6.546889 1.169544,0 4.517128,-3.265098 4.577029,-4.211731 -0.01473,-0.309325 -6.638214,-2.945953 -9.220832,-5.489292 -1.379688,-1.360048 -2.034672,-2.015032 -2.615025,-2.507006 a 11.381198,11.381198 0 0 0 -0.98198,-0.74434 17.646258,17.646258 0 0 1 -0.107036,-9.302337 28.182949,28.182949 0 0 0 -9.160932,7.080107 h -0.01768 C 15.006679,21.668832 15.112733,15.364493 15.199148,14.047652 A 6.8031872,6.8031872 0 0 0 13.92846,14.722275 27.711597,27.711597 0 0 0 10.208703,17.908814 33.230349,33.230349 0 0 0 6.6509746,22.1775 v 0.0059 -0.0069 A 32.140346,32.140346 0 0 0 1.5446612,33.705014 l -0.051063,0.251388 c -0.071685,0.334856 -0.3927937,2.035653 -0.438947,2.400951 a 44.277672,44.277672 0 0 0 -0.56169503,5.305661 v 0.196397 A 38.061711,38.061711 0 0 0 76.056648,48.295336 c 0.06383,-0.490992 0.115874,-0.977074 0.172829,-1.472976 A 39.141894,39.141894 0 0 0 73.760768,27.703126 Z m -3.775729,1.95513 0.0069,0.04026 z"
				fill="url(#l)"
				id="path77"
				style="fill:none;stroke:#eba0ac;stroke-width:0.981984;stroke-opacity:1"
			/>
		</svg>
	</div>
	<div class="searchbar">
		<div class="searchbar_outline" />
		<!-- searchbar -->
		<input
			type="text"
			class="search_input"
			placeholder="Search the web"
			bind:value={searchTerm}
			bind:this={input}
			on:keypress={(e) => e.key === 'Enter' && performSearch()}
		/>
		<button class="search_button" on:click={performSearch}>Search</button>
	</div>
	<div class="links">
		{#each links as link}
			<div class="link_block">
				<div class="link_outline"></div>
				<div class="link_title">{link.title}</div>
				{#each link.children as child, i}
				<a class="link" href={child.url} target="_blank" style="top: {(i*3)+ 5}vh;">>{child.name}</a>
				{/each}
			</div>
		{/each}
	</div>
</div>

<canvas id="canvas" bind:this={canvas} {width} {height}> </canvas>

<style>
	@import '/src/styles/global.scss';
</style>
