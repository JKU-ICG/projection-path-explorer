import * as concaveman from 'concaveman'
import * as libtess from 'libtess'

var tessy = (function initTesselator() {
    // function called for each vertex of tesselator output
    function vertexCallback(data, polyVertArray) {
        // console.log(data[0], data[1]);
        polyVertArray[polyVertArray.length] = data[0];
        polyVertArray[polyVertArray.length] = data[1];
    }
    function begincallback(type) {
        if (type !== libtess.primitiveType.GL_TRIANGLES) {
            console.log('expected TRIANGLES but got type: ' + type);
        }
    }
    function errorcallback(errno) {
        console.log('error callback');
        console.log('error number: ' + errno);
    }
    // callback for when segments intersect and must be split
    function combinecallback(coords, data, weight) {
        // console.log('combine callback');
        return [coords[0], coords[1], coords[2]];
    }
    function edgeCallback(flag) {
        // don't really care about the flag, but need no-strip/no-fan behavior
        // console.log('edge flag: ' + flag);
    }


    var tessy = new libtess.GluTesselator();
    // tessy.gluTessProperty(libtess.gluEnum.GLU_TESS_WINDING_RULE, libtess.windingRule.GLU_TESS_WINDING_POSITIVE);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_VERTEX_DATA, vertexCallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_BEGIN, begincallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_ERROR, errorcallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_COMBINE, combinecallback);
    tessy.gluTessCallback(libtess.gluEnum.GLU_TESS_EDGE_FLAG, edgeCallback);

    return tessy;
})();

function triangulate(contours) {
    // libtess will take 3d verts and flatten to a plane for tesselation
    // since only doing 2d tesselation here, provide z=1 normal to skip
    // iterating over verts only to get the same answer.
    // comment out to test normal-generation code
    tessy.gluTessNormal(0, 0, 1);

    var triangleVerts = [];
    tessy.gluTessBeginPolygon(triangleVerts);

    for (var i = 0; i < contours.length; i++) {
        tessy.gluTessBeginContour();
        var contour = contours[i];
        for (var j = 0; j < contour.length; j += 2) {
            var coords = [contour[j], contour[j + 1], 0];
            tessy.gluTessVertex(coords, coords);
        }
        tessy.gluTessEndContour();
    }

    // finish polygon (and time triangulation process)
    var startTime = new Date().getTime();
    tessy.gluTessEndPolygon();
    var endTime = new Date().getTime();

    return triangleVerts;
}











































/**
 * @param input a list of cluster vertices
 */
self.addEventListener('message', function (e) {
    if (e.data.messageType == 'triangulate') {
        let Y = []
        
        for (let i = 0; i < e.data.input.length; i++) {
            // Get hull of cluster
            var polygon = concaveman(e.data.input[i]);

            // Get triangulated hull for cluster
            var triangulated = triangulate([polygon.flat()])

            Y.push({ hull: polygon, triangulation: triangulated })
        }

        // Get rid of typescript warning
        let postMessage = self.postMessage as any
        postMessage(Y)
    }
})
