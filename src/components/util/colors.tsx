var d3v5 = require('d3')







export class QualitativeScaleMapping {
  scale: any
  values: any

  constructor(scale, values) {
    this.scale = scale
    this.values = values
  }

  getMapping() {
    return this.values.reduce((map, value) => {
      map[value] = this.scale.map(this.values.indexOf(value))
      return map
    }, {})
  }

  map(value) {
    return this.scale.map(this.values.indexOf(value))
  }
}

export class SequentialScaleMapping {
  scale: any
  range: any

  constructor(scale, range) {
    this.scale = scale
    this.range = range
  }

  map(value) {
    var normalized = (value - this.range.min) / (this.range.max - this.range.min)
    return this.scale.map(normalized)
  }
}





export class SchemeColor {
  hex: string
  rgb: { r, g, b }

  constructor(hex) {
    this.hex = hex
    this.rgb = this.hexToRgb(this.hex)
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }



  static componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }

  static rgbToHex(r, g, b) {
    return new SchemeColor("#" + SchemeColor.componentToHex(r) + SchemeColor.componentToHex(g) + SchemeColor.componentToHex(b))
  }
}

export class ColorScheme {
  colors: any
  mapping: any

  constructor(colors) {
    this.colors = colors
  }

  getMapping() {
    return this.mapping
  }

  createMapping(values) {

    var i = 0
    this.mapping = values.reduce((map, obj) => {
      map[obj] = this.colors[i % this.colors.length]
      i++
      return map
    }, {})

    return new QualitativeScaleMapping(this, values)
  }

  map(value) {
    return this.colors[value]
  }
}













export class LinearColorScale {
  stops: any
  type: any
  interpolator: any

  constructor(stops, type) {
    this.stops = stops
    this.type = type
    this.interpolator = d3v5.scaleLinear()
      .domain(this.stops.map((stop, index) => (1 / (this.stops.length - 1)) * index)).range(this.stops.map(stop => stop.hex))

  }

  createMapping(range) {
    if (this.type == "continuous") {
      return new SequentialScaleMapping(this, range)
    } else {
      return new QualitativeScaleMapping(this, range)
    }
  }
}

export class ContinuosScale extends LinearColorScale {
  constructor(stops) {
    super(stops, "continuous");
  }

  map(value) {
    var d3color = d3v5.color(this.interpolator(value))
    return SchemeColor.rgbToHex(d3color.r, d3color.g, d3color.b)
  }
}

export class DiscreteScale extends LinearColorScale {
  constructor(stops) {
    super(stops, "discrete")
  }

  map(value) {
    return this.stops[value]
  }
}














class Mapping {
  scale: any

  constructor(scale) {
    this.scale = scale
  }
}

export class DiscreteMapping extends Mapping {
  values: any

  constructor(scale, values) {
    super(scale)

    this.values = values
  }

  index(value) {
    return this.values.indexOf(value)
  }

  map(value) {
    return this.scale.map(this.values.indexOf(value) % this.scale.stops.length)
  }
}

export class ContinuousMapping extends Mapping {
  range: any

  constructor(scale, range) {
    super(scale)

    this.range = range
  }

  map(value) {
    if (this.range.max == this.range.min) {
      return this.scale.map(0)
    }
    var normalized = (value - this.range.min) / (this.range.max - this.range.min)
    return this.scale.map(normalized)
  }
}
















export class DefaultLineColorScheme extends ColorScheme {
  constructor() {
    super([
      new SchemeColor("#1b9e77"),
      new SchemeColor("#d95f02"),
      new SchemeColor("#7570b3"),
      new SchemeColor("#e7298a"),
      new SchemeColor("#66a61e"),
      new SchemeColor("#e6ab02"),
      new SchemeColor("#a6761d"),
      new SchemeColor("#666666")
    ])
  }
}

/**
 * Breaks an integer down into its r,g,b components.
 */
export function hexToRGB(color) {
  return {
    r: (color & 0xff0000) >> 16,
    g: (color & 0x00ff00) >> 8,
    b: (color & 0x0000ff)
  }
}





export var NamedScales = {
  VIRIDIS: () => new ContinuosScale([
    new SchemeColor("#440154"),
    new SchemeColor("#482475"),
    new SchemeColor("#414487"),
    new SchemeColor("#355f8d"),
    new SchemeColor("#2a788e"),
    new SchemeColor("#21908d"),
    new SchemeColor("#22a884"),
    new SchemeColor("#42be71"),
    new SchemeColor("#7ad151"),
    new SchemeColor("#bddf26"),
    new SchemeColor("#bddf26")
  ]),
  RdYlGn: () => new ContinuosScale([
    new SchemeColor("#a50026"),
    new SchemeColor("#d3322b"),
    new SchemeColor("#f16d43"),
    new SchemeColor("#fcab63"),
    new SchemeColor("#fedc8c"),
    new SchemeColor("#f9f7ae"),
    new SchemeColor("#d7ee8e"),
    new SchemeColor("#a4d86f"),
    new SchemeColor("#64bc61"),
    new SchemeColor("#23964f"),
    new SchemeColor("#23964f")
  ])
}

export var NamedCategoricalScales = {
  SET1: () => new DiscreteScale([
    new SchemeColor("#e41a1c"),
    new SchemeColor("#377eb8"),
    new SchemeColor("#4daf4a"),
    new SchemeColor("#984ea3"),
    new SchemeColor("#ff7f00"),
    new SchemeColor("#ffff33"),
    new SchemeColor("#a65628"),
    new SchemeColor("#f781bf"),
    new SchemeColor("#999999")
  ]),
  DARK2: () => new DiscreteScale([
    new SchemeColor("#1b9e77"),
    new SchemeColor("#d95f02"),
    new SchemeColor("#7570b3"),
    new SchemeColor("#e7298a"),
    new SchemeColor("#66a61e"),
    new SchemeColor("#e6ab02"),
    new SchemeColor("#a6761d"),
    new SchemeColor("#666666")
  ])

}



export const mappingFromScale = (scale, attribute, dataset) => {
  if (scale instanceof DiscreteScale) {
    // Generate scale
    return new DiscreteMapping(scale, [... new Set(dataset.vectors.map(vector => vector[attribute.key]))])
  }
  if (scale instanceof ContinuosScale) {
    var min = null, max = null
    if (attribute.key in dataset.ranges) {
      min = dataset.ranges[attribute.key].min
      max = dataset.ranges[attribute.key].max
    } else {
      var filtered = dataset.vectors.map(vector => vector[attribute.key])
      max = Math.max(...filtered)
      min = Math.min(...filtered)
    }

    return new ContinuousMapping(scale, { min: min, max: max })
  }
  return null
}

export function defaultScalesForAttribute(attribute) {
  if (attribute.type == 'categorical') {
    return [
      NamedCategoricalScales.DARK2(),
      NamedCategoricalScales.SET1(),
      new DiscreteScale([
        new SchemeColor("#1f77b4"),
        new SchemeColor("#ff7f0e"),
        new SchemeColor("#2ca02c"),
        new SchemeColor("#d62728"),
        new SchemeColor("#9467bd"),
        new SchemeColor("#8c564b"),
        new SchemeColor("#e377c2"),
        new SchemeColor("#7f7f7f"),
        new SchemeColor("#bcbd22"),
        new SchemeColor("#17becf")
      ])
    ]
  } else {
    return [
      NamedScales.VIRIDIS(),
      NamedScales.RdYlGn(),
      new ContinuosScale([
        new SchemeColor('#fdcc8a'),
        new SchemeColor('#b30000')
      ]),
      new ContinuosScale([
        new SchemeColor('#a6611a'),
        new SchemeColor('#f5f5f5'),
        new SchemeColor('#018571')
      ]),
      new ContinuosScale([
        new SchemeColor('#ca0020'),
        new SchemeColor('#f7f7f7'),
        new SchemeColor('#0571b0')
      ])

    ]
  }

}