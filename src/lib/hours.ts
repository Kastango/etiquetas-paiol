import { store } from "./brand";
import { COLORS } from "./offer";

export type HoursFormat = "a4" | "portrait" | "story";
export interface HoursRow { days: string; hours: string }
export interface Hours {
  title: string;
  /** Each row: the days, then their hours; a line break in the hours starts a new line on the sign. */
  rows: HoursRow[];
  /** An optional notice under the hours, such as a holiday. */
  note: string;
  whatsapp: string;
}
export interface HoursAssets { logo: HTMLImageElement; sans: string }

export const defaultHours = (): Hours => ({
  title: "Horário de funcionamento",
  rows: [
    { days: "Segunda a sexta", hours: "Das 8h30 às 12h00\ne 13h30 às 18h30" },
    { days: "Sábado", hours: "Das 8h30 às 12h30" },
    { days: "Domingo", hours: "Fechado" },
  ],
  note: "",
  whatsapp: store.whatsapp,
});

/**
 * Sizes in px of the file. Every sign is drawn on a 1080-unit width and scaled to the file. Stories keep the
 * logo below the top 250 px and the WhatsApp above the bottom 150 px, clear of Instagram's bars.
 */
export const HOURS_FORMATS: Record<HoursFormat, { label: string; detail: string; width: number; height: number; safeTop: number; safeBottom: number }> = {
  a4: { label: "A4", detail: "Imprimir", width: 2480, height: 3508, safeTop: 0, safeBottom: 0 },
  portrait: { label: "Feed", detail: "4:5", width: 1080, height: 1350, safeTop: 0, safeBottom: 0 },
  story: { label: "Story", detail: "9:16", width: 1080, height: 1920, safeTop: 250, safeBottom: 150 },
};

const W = 1080, MARGIN = 140;
// The WhatsApp logo from Simple Icons (CC0), drawn on a 24-unit square.
const WHATSAPP = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

const lines = (text: string) => text.split("\n").map(line => line.trim()).filter(Boolean);
const filled = (rows: HoursRow[]) => rows.filter(row => row.days.trim() || row.hours.trim());

/**
 * The sign of the Canva template: green band with the logo, the title over a green rule, each row's days
 * over its hours, and the WhatsApp at the bottom right. The rows are centred between the rule and the
 * WhatsApp; when they do not fit, the space between them closes up first, then the letters shrink.
 */
export function drawHours(ctx: CanvasRenderingContext2D, hours: Hours, format: HoursFormat, assets: HoursAssets) {
  const F = HOURS_FORMATS[format], scale = F.width / W, H = F.height / scale;
  const font = (weight: number, size: number) => `${weight} ${size}px ${assets.sans}`;
  ctx.canvas.width = F.width;
  ctx.canvas.height = F.height;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // The band is 29% of the width below the safe area; the logo's drawing is 45% of that, centred in it.
  const band = F.safeTop + 313;
  ctx.fillStyle = COLORS.verde;
  ctx.fillRect(0, 0, W, band);
  const logoHeight = 140, image = logoHeight * 1.16; // the logo's files pad the drawing by 8% on each side
  const logoWidth = image * (assets.logo.naturalWidth / assets.logo.naturalHeight);
  ctx.drawImage(assets.logo, (W - logoWidth) / 2, (F.safeTop + band - image) / 2, logoWidth, image);

  const width = W - MARGIN * 2;
  const title = (hours.title.trim() || "Horário de funcionamento").toLocaleUpperCase("pt-BR");
  let titleSize = 41;
  ctx.font = font(400, titleSize);
  titleSize = Math.min(titleSize, (titleSize * width) / ctx.measureText(title).width);
  ctx.font = font(400, titleSize);
  ctx.fillStyle = COLORS.texto;
  ctx.textAlign = "left";
  const titleY = band + 121;
  ctx.fillText(title, MARGIN, titleY);
  const rule = titleY + 46;
  ctx.fillStyle = COLORS.verde;
  ctx.fillRect(MARGIN, rule, width, 5);

  // WhatsApp: logo over the number, right-aligned.
  let bottom = H - F.safeBottom - 72;
  if (hours.whatsapp.trim()) {
    ctx.font = font(500, 50);
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.texto;
    ctx.fillText(hours.whatsapp.trim(), W - MARGIN, bottom);
    const icon = 92, top = bottom - 50 * 0.72 - 30 - icon;
    ctx.save();
    ctx.translate(W - MARGIN - icon, top);
    ctx.scale(icon / 24, icon / 24);
    ctx.fillStyle = COLORS.verde;
    ctx.fill(new Path2D(WHATSAPP));
    ctx.restore();
    bottom = top;
  }

  // Rows at their full size, measured from the first day's capitals to the last baseline: the lines (which scale
  // with the letters by k) and the spaces between rows and before the notice (which first close up to 60%, by g).
  const rows = filled(hours.rows), note = lines(hours.note);
  const size = { day: 39, hours: 50, note: 40 };
  const gap = { dayToHours: 80, hoursLead: 71, rows: 143, note: 130, noteLead: 56 };
  let text = rows.length ? size.day * 0.7 : 0, spaces = 0, widest = 0;
  rows.forEach((row, i) => {
    if (i) spaces += gap.rows;
    text += gap.dayToHours + Math.max(0, lines(row.hours).length - 1) * gap.hoursLead;
    ctx.font = font(400, size.day);
    widest = Math.max(widest, ctx.measureText(row.days.trim()).width);
    ctx.font = font(600, size.hours);
    for (const line of lines(row.hours)) widest = Math.max(widest, ctx.measureText(line).width);
  });
  if (note.length) {
    if (rows.length) spaces += gap.note; else text += size.note * 0.7;
    text += (note.length - 1) * gap.noteLead;
    ctx.font = font(600, size.note);
    for (const line of note) widest = Math.max(widest, ctx.measureText(line).width);
  }
  const room = bottom - rule - 2 * 60;
  const g = spaces ? Math.max(0.6, Math.min(1, (room - text) / spaces)) : 1;
  const k = Math.min(1, room / Math.max(text + spaces * g, 1), width / Math.max(widest, 1));
  let y = rule + (bottom - rule - (text + spaces * g) * k) / 2 + (rows.length ? size.day : size.note) * 0.7 * k;

  ctx.textAlign = "left";
  rows.forEach((row, i) => {
    if (i) y += gap.rows * g * k;
    ctx.font = font(400, size.day * k);
    ctx.fillStyle = COLORS.texto;
    ctx.fillText(row.days.trim(), MARGIN, y);
    y += gap.dayToHours * k;
    ctx.font = font(600, size.hours * k);
    lines(row.hours).forEach((line, j) => ctx.fillText(line, MARGIN, y + j * gap.hoursLead * k));
    y += Math.max(0, lines(row.hours).length - 1) * gap.hoursLead * k;
  });
  if (note.length) {
    if (rows.length) y += gap.note * g * k;
    ctx.font = font(600, size.note * k);
    ctx.fillStyle = COLORS.vinho;
    note.forEach((line, j) => ctx.fillText(line, MARGIN, y + j * gap.noteLead * k));
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/** The hours as text for WhatsApp and Instagram, in the Paiol voice. */
export function hoursText(hours: Hours) {
  const sentence = (text: string) => text.charAt(0).toLocaleLowerCase("pt-BR") + text.slice(1);
  const rows = filled(hours.rows).map(row => `${row.days.trim()}: ${sentence(lines(row.hours).join(" "))}`);
  const whatsapp = hours.whatsapp.trim();
  return [
    `${hours.title.trim() || "Horário de funcionamento"} 🍃`,
    ...rows,
    ...lines(hours.note),
    "",
    `Esperamos por você na ${store.address} 💚`,
    ...(whatsapp ? [`WhatsApp: ${whatsapp}`] : []),
  ].join("\n");
}
