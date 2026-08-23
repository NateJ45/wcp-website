// =============================================================================
// seed-store-feature.mjs — the Family Hub store card content
// =============================================================================
// HISTORICAL (ran 2026-07-15): seeded the store card headline/blurb and a
// curated set of featured merch onto Site Settings. Those fields MOVED to the
// `hubStore` singleton on 2026-08-23 (scripts/patch-hub-store.mjs copied the
// values), so the Board now edits them in Studio -> Family Hub workspace ->
// Merch store card. Do NOT re-run this script: it writes to fields the
// schema and the hub no longer read.
// Run (historical): node scripts/seed-store-feature.mjs
// =============================================================================
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = (readFileSync(`${SITE_DIR}/.dev.vars`, 'utf8').match(/SANITY_TOKEN="([^"]+)"/) ||
  [])[1];
if (!token) throw new Error('no SANITY_TOKEN in .dev.vars');
const client = createClient({
  projectId: 'niemhgev',
  dataset: 'production',
  apiVersion: '2025-01-01',
  token,
  useCdn: false,
});

const STORE = 'https://store.westchesterpreschool.org';
const img = (u) => u; // full signed imgproxy URLs (can't be re-transformed)

const products = [
  {
    title: 'White Unisex Tee',
    price: '$24.99',
    handle: 'white-unisex-tee',
    image:
      'https://imgproxy.fourthwall.dev/jXrunIh9jAGUxSwWKM-SBY3ic37S0zYcDvi6adkv7EE/w:720/sm:1/enc/bocc0qUdFtfFT2qz/vwulQSX7a8Z1n1S3/i7pinOCjwQmr3mB0/n6nrknP-klH_tQKf/AgLdjBU6a20oiLdX/YkjgV1kF5yOHYj71/804U78CgkoWTzFZz/1zGm2ObEGXJdkNrV/v6urckY31Iui9tFM/FSKtITKvnf3JBm74/-Zy1t4OvxuZos8tm/gy0R3yMNLi-BMD16/CHFAibNQ2voT4usB/tTFIetYmTHyGUSm6/QKPFoQnd-8U.jpg',
  },
  {
    title: 'Unisex White Hoodie',
    price: '$39.99',
    handle: 'unisex-white-hoodie',
    image:
      'https://imgproxy.fourthwall.dev/q5J9gwtNAh1k7IBXGlAZ_IVq4lQ_-E5NFpnc4idejTQ/w:720/sm:1/enc/KFeuu-zhC_pm9yfw/ifX3aRqXpANZBRlX/4ZJhQ-SKm6QzrDGZ/2wW1HVW1sgmY2GPy/kgL0Jl8g34FCUvKb/WUzi5Y3wFYcccHTi/vCpnwYvpnC9MvtBR/EUm4BVHTQEFyj9kM/daCGaTSPGIZjWFbR/evQlxkmBLeKIOPvA/O8h8wC51BmQ6efHh/fUmp7rYlImm7sQGS/KLOsq6uXxYaEsApX/D4f_YDruSg9Cy3rj/tr6v3jO8dV8.jpg',
  },
  {
    title: 'Toddler Tee',
    price: '$19.99',
    handle: 'toddler-tee',
    image:
      'https://imgproxy.fourthwall.dev/4YEj_T2TMRjg5JTu9NCKttQv5P9GRDoiMQib2SW-ORk/w:720/sm:1/enc/6uwSZB9tJR3omzbU/kbVdiwpeD26eoVPZ/Vq3WDyfQTymhO2Ai/6IbqOXc4gj_A3hGT/C5ref1sh7AypOf5h/mUiRXsy7f6zqOWWi/KeyYZewCs-3C22BK/hpvYiSs2y5DaaYY0/8LFkffBr-QXfqXvz/Y8c6oXLO6TUv0xY3/tCiOhnKR8YLRoCEp/KbAEhjzRZRIdPwc1/oZWodztnFHOtRvOm/Xm3yRA4glHeg0h9r/F9ds_leXZRw.jpg',
  },
  {
    title: 'Youth Tee',
    price: '$19.99',
    handle: 'youth-tee',
    image:
      'https://imgproxy.fourthwall.dev/98N6Y4w25nF7j7KH2IDnv7WOpW4U6DK9JTPybn3CGvA/w:720/sm:1/enc/WE5_wS7lDovI0gTE/ooCWix9Ib5ujAhGN/UidQyo_5KHgvcdCE/FmUcsICJiVpCxfE6/3atPSUuw9uBBwKWc/NjZzwSlajx5JI019/jd-U5azBRhO5B-8H/jvcQaPf9-F7Ejdq6/96ELmUB3Z6N_hQXp/4-yMbHA7hTFrzqRb/oBPNVglTqrrDYCCd/eyc8ddH1czq-DrgH/cFXZQ_xZ9hOauxPL/yQYOUl3u5qUFCE5J/BQTuzknHmQI.jpg',
  },
  {
    title: 'Beanie',
    price: '$18.99',
    handle: 'beanie',
    image:
      'https://imgproxy.fourthwall.dev/77hBvrxq5Bmt25xu-w9sf3-mN25Oz4mkPrPq-JbZIjA/w:720/sm:1/enc/mPUbbMq5JFHaLsQf/-C6V9evelVX-b5SP/gKh8rQv2OmP40hW-/IBckOxO6xkVvxgF7/bCgFgT70ENwcT-k2/svcD1yZvjkxXUYB6/ANPfwxNeMYPqjZ2W/8ViH5JcJ_vs0o44-/WVBXkTKYjh6yN7-f/mFIWZs5NlsjUgBEG/SlDP1oTNGoy2VyXv/6UsEvQWyNHAMOoLI/cB93PkKQ9Rj_yGkc/fT1hiKW-VDpxCgXG/1oyDjq67MSU.jpg',
  },
  {
    title: "Women's Crop Hoodie",
    price: '$44.99',
    handle: 'womens-crop-hoodie',
    image:
      'https://imgproxy.fourthwall.dev/VQU2hdhJ1j5u-zTuo_pf9Unp7js12peQdKsk3pOV06g/w:720/sm:1/enc/ViF-SSFIxSwkFpNj/3Oj0yjsXWA2ci3R5/N1bcqNce1UXA-9KY/JxPLWnHODCAf1CFV/z1hvyszRcvLapKhJ/NxOJYHRvMpZGBMux/aPTaD8TgE_DeJmhf/rZPfOHe0O4qYhMGy/H7ILlGWNEVRftWa5/iVmT2o27mmG8ZJVo/k9CdAlQwrF1GREUS/lOWUseBd9pxYlTgR/ndPW5kte74xbWSgx/5HtSstJKIUWvJn0E/XbJeF39uScU.jpg',
  },
  {
    title: "Women's Relaxed V-Neck Tee",
    price: '$26.49',
    handle: 'womens-relaxed-v-neck-tee',
    image:
      'https://imgproxy.fourthwall.dev/U7Qsr5HOfIPIreHM0k5q98hGC9GI5yke9SaX4BNJ0n8/w:720/sm:1/enc/3bc-tFknd0Yc-Cn-/6TsUrPiTaM89IatU/NV8a1U6JY5X64GMN/hPEGQPNPO4EDjHFg/-CUrHmwv1WzMDDhi/nURZ8CnbJsM7O09c/e4X_G1AOTNz1VaIv/zGuGnEJlYtHMPX4J/D1EJV1zYaqnGiv2K/ORRr79d11E1xtgor/JqkOfQxhe-XVfHVA/x0OqP8M-cZ_1-IDi/KtsoFvcsfbUtw6St/px1E4asYV732y0HN/JDHMYdAnmiE.jpg',
  },
  {
    title: 'Unisex White Long Sleeve Tee',
    price: '$29.99',
    handle: 'unisex-white-long-sleeve-tee',
    image:
      'https://imgproxy.fourthwall.dev/KmjxVF_e1Iz4_lkzBHjRGoNbZ6faEFi3SXgF-SUeWDg/w:720/sm:1/enc/q466AXjnTZJtBBze/kyM07uHPaBjobFV0/DFKA4S4e2TSfhBsm/T9dcYgPqdRvECHdH/TQ1iKpp1-bcMAl3z/tyIUR9UofvVWjfDi/K4pZolIvU-DgF2Rc/bPagKIH08duO_5Fy/N4oEZP76cHhvrjIK/YICInUMHnuUuTuqN/SOFPyCQW-Z19L9Ve/kURWdlJwiX06wTo2/txN7F-ZN3dIRwCyI/xmnMsCusPWIPCD4W/aKsL_XCH_3g.jpg',
  },
];

let k = 0;
const storeProducts = products.map((p) => ({
  _type: 'object',
  _key: `sp${(k++).toString(36)}`,
  title: p.title,
  price: p.price,
  url: `${STORE}/products/${p.handle}`,
  image: img(p.image),
}));

const id = await client.fetch(`*[_type == "siteSettings"][0]._id`);
if (!id) throw new Error('no siteSettings doc');
await client
  .patch(id)
  .set({
    storeUrl: `${STORE}/`,
    storeHeadline: 'The Official WCP Store',
    storeTagline:
      'Every purchase supports our co-op. Tees, hoodies, hats, and more, all in West Chester Preschool colors.',
    storeProducts,
  })
  .commit();
console.log(`✓ ${id}: store card set (${storeProducts.length} featured products)`);
