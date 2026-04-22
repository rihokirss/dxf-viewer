
import * as helpers from "../ParseHelpers.js"

/**
 * Parser for the legacy LEADER entity (AutoCAD R13+, DXF group 100 = "AcDbLeader").
 *
 * Output shape:
 *   {
 *     type: "LEADER",
 *     vertices: [{x,y,z}, ...],   // ordered along the leader path (group 10/20/30)
 *     arrowEnabled: bool,         // group 71 (default true)
 *     pathType: 0|1,              // group 72: 0=straight, 1=spline
 *     annotationType: 0|1|2|3,    // group 73
 *     styleName: string,          // group 3 (DIMSTYLE name)
 *     textHeight: number,         // group 40
 *     textWidth: number,          // group 41
 *     horizontalDirection: {x,y,z}, // group 211/221/231
 *     associatedAnnotation: handle, // group 340
 *     ... + common entity props (layer, color, lineType, etc.)
 *   }
 *
 * MLEADER (AcDbMLeader) is a separate, much more complex entity and is NOT
 * handled here.
 */
export default function EntityParser() {}

EntityParser.ForEntityName = 'LEADER'

EntityParser.prototype.parseEntity = function(scanner, curr) {
    const entity = { type: curr.value, vertices: [], arrowEnabled: true }
    curr = scanner.next()
    while (curr !== 'EOF') {
        if (curr.code === 0) break

        switch (curr.code) {
        case 3: // DIMSTYLE name
            entity.styleName = curr.value
            break
        case 10: // Vertex X (Y/Z follow as 20/30 — handled by parsePoint)
            entity.vertices.push(helpers.parsePoint(scanner))
            break
        case 40: // Text annotation height
            entity.textHeight = curr.value
            break
        case 41: // Text annotation width
            entity.textWidth = curr.value
            break
        case 71: // Arrowhead flag (0 = off, 1 = on)
            entity.arrowEnabled = curr.value !== 0
            break
        case 72: // Leader path type (0 = straight segments, 1 = spline)
            entity.pathType = curr.value
            break
        case 73: // Annotation type
            entity.annotationType = curr.value
            break
        case 74: // Hookline direction flag
            entity.hooklineDirection = curr.value
            break
        case 75: // Hookline flag
            entity.hookline = curr.value !== 0
            break
        case 76: // Number of vertices (informational, vertices already collected)
            entity.vertexCount = curr.value
            break
        case 77: // Color of annotation reference
            entity.byBlockColor = curr.value
            break
        case 211: // Horizontal direction X
            entity.horizontalDirection = helpers.parsePoint(scanner)
            break
        case 210: // Block reference normal
            entity.normal = helpers.parsePoint(scanner)
            break
        case 213: // Offset of last leader vertex from annotation placement point
            entity.offsetFromAnnotation = helpers.parsePoint(scanner)
            break
        case 340: // Hard reference of associated annotation (MText/Tolerance/Block)
            entity.associatedAnnotation = curr.value
            break
        case 100: // Subclass marker
            break
        default:
            helpers.checkCommonEntityProperties(entity, curr, scanner)
            break
        }

        curr = scanner.next()
    }
    return entity
}
