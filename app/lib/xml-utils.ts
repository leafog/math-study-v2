/** SVG 与 XML 字符串互转工具 */

/** 把 SVGElement 序列化成 XML 字符串 */
export function svgToXmlString(svg: SVGElement): string {
  return new XMLSerializer().serializeToString(svg);
}

/**
 * 把 XML 字符串反序列化成 SVGElement。
 * 解析失败(不是合法 XML)时抛错；根节点不是 svg 时也抛错。
 */
export function xmlStringToSvg(xml: string): SVGSVGElement {
  const doc = new DOMParser().parseFromString(xml, "image/svg+xml");
  const err = doc.querySelector("parsererror");
  if (err) {
    throw new Error(`Invalid SVG XML: ${err.textContent}`);
  }
  if (!(doc.documentElement instanceof SVGSVGElement)) {
    throw new TypeError("Root element is not an <svg>");
  }
  return doc.documentElement;
}
