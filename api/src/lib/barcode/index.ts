import bwipjs from "bwip-js";
import QRCode from "qrcode";

// Renders server-side (no DOM/canvas needed) so the same PNG can be
// embedded into printed label sheets or invoice PDFs later, not just
// displayed in the browser.
export async function generateBarcodePng(value: string): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: value,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: "center",
  });
}

export async function generateQrCodePng(value: string): Promise<Buffer> {
  return QRCode.toBuffer(value, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}
