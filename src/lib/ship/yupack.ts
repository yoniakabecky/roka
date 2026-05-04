import Papa from 'papaparse';
import type { SenderProfile } from './sender';
import { normalizePhone, shippingAddressLine1, SHOPIFY_FIELDS } from './shopify';

export const HEADERS: string[] = [
	'お客様側管理番号',
	'発送予定日',
	'発送予定時間区分',
	'出荷期限日',
	'到着期限日',
	'郵便種別',
	'保冷種別',
	'元／着払／代引',
	'書留／セキュリティ／特定記録種別',
	'配達時間帯指定郵便種別',
	'送り状種別',
	'お届け先 コード',
	'お届け先 郵便番号',
	'お届け先 住所１',
	'お届け先 住所２',
	'お届け先 住所３',
	'お届け先 名称１',
	'お届け先 名称２',
	'お届け先 敬称区分',
	'お届け先 電話番号',
	'お届け先 メールアドレス１',
	'お届け先 局留め区分',
	'お届け先 局留め郵便局名',
	'お届け先 局留めメール使用区分',
	'お届け先 局留め郵便番号',
	'お届け先 配達予告メール使用区分',
	'お届け先 再配達予告メール使用区分',
	'ご依頼主 コード',
	'ご依頼主 集荷先と同一区分',
	'ご依頼主 郵便番号',
	'ご依頼主 住所１',
	'ご依頼主 住所２',
	'ご依頼主 住所３',
	'ご依頼主 名称１',
	'ご依頼主 名称２',
	'ご依頼主 敬称',
	'ご依頼主 電話番号',
	'ご依頼主 メールアドレス１',
	'ご依頼主 荷送人指図区分',
	'ご依頼主 お届け通知メール使用区分',
	'ご依頼主 お届け通知はがき使用区分',
	'集荷先 コード',
	'集荷先 連携可否区分',
	'集荷先 会社コード',
	'集荷先 依頼先店所コード',
	'集荷先 郵便番号',
	'集荷先 住所１',
	'集荷先 住所２',
	'集荷先 住所３',
	'集荷先 名称１',
	'集荷先 名称２',
	'集荷先 敬称',
	'集荷先 電話番号',
	'受注番号',
	'こわれもの区分',
	'なまもの区分',
	'ビン類区分',
	'逆さま厳禁区分',
	'下積み厳禁区分',
	'商品サイズ区分',
	'重量合計（ｇ）',
	'25kg超重量物区分',
	'損害要償額',
	'速達・配達日指定種別',
	'配達指定日／希望日',
	'配達時間帯区分',
	'差出方法区分',
	'ゆうパック複数個割引',
	'ゆうパック同一割引',
	'セット商品コード',
	'セット品名ラベル印字区分',
	'複数個口数',
	'記事名１',
	'記事名２',
	'フリー項目０１',
	'フリー項目０２',
	'フリー項目０３',
	'フリー項目０４',
	'フリー項目０５',
	'フリー項目０６',
	'フリー項目０７',
	'フリー項目０８',
	'フリー項目０９',
	'フリー項目１０',
	'空港利用区分',
	'空港・局／支店名',
	'航空会社名',
	'利用便名',
	'レジャー区分',
	'プレー・搭乗日',
	'プレー・搭乗時間',
	'クラブ本数',
	'復路集貨日',
	'出荷先登録名',
	'集荷希望区分',
	'集荷日付',
	'集荷時間帯区分',
	'支店連携先選択用名称',
	'代引金額',
	'代引消費税金額',
	'送り状発行年月日',
	'商品番号',
	'品名',
	'個数',
	'重量（ｇ）',
	'単価',
	'金額',
	'商品備考０１',
	'商品備考０２',
	'商品備考０３',
	'商品備考０４',
	'商品備考０５',
	'商品備考０６',
	'商品備考０７',
	'商品備考０８',
	'商品備考０９',
	'商品備考１０'
];

const EMPTY_ROW: Record<string, string> = Object.fromEntries(HEADERS.map((h) => [h, '']));

export const extractSize = (shippingMethod: string): string => {
	const match = shippingMethod.match(/(\d+)サイズ/);
	// If no size is found, leave it as '' (empty)
	return match ? match[1].padStart(3, '0') : '';
};

export const mapToYupack = (
	order: Record<string, string>,
	sender: SenderProfile
): Record<string, string> => {
	const row: Record<string, string> = { ...EMPTY_ROW };

	row['お客様側管理番号'] = order[SHOPIFY_FIELDS.NAME] ?? '';
	row['郵便種別'] = '0';
	row['保冷種別'] = '1'; // 1 = 冷蔵; derive from Shipping Method when product types expand
	row['元／着払／代引'] = '0';
	row['送り状種別'] = '1100780';
	row['お届け先 郵便番号'] = (order[SHOPIFY_FIELDS.SHIPPING_ZIP] ?? '').replace(/-/g, '');
	row['お届け先 住所１'] = shippingAddressLine1(order);
	row['お届け先 住所２'] = order[SHOPIFY_FIELDS.SHIPPING_ADDRESS2] ?? '';
	row['お届け先 名称１'] = order[SHOPIFY_FIELDS.SHIPPING_NAME] ?? '';
	row['お届け先 敬称区分'] = '0';
	row['お届け先 電話番号'] = normalizePhone(order[SHOPIFY_FIELDS.SHIPPING_PHONE] ?? '');
	row['お届け先 メールアドレス１'] = order[SHOPIFY_FIELDS.EMAIL] ?? '';
	row['ご依頼主 郵便番号'] = sender.zipcode.replace(/-/g, '');
	row['ご依頼主 住所１'] = sender.address;
	row['ご依頼主 住所２'] = sender.address2;
	row['ご依頼主 名称１'] = sender.name;
	row['ご依頼主 電話番号'] = sender.phone;
	row['ご依頼主 メールアドレス１'] = sender.email;
	row['こわれもの区分'] = '0';
	row['なまもの区分'] = '0';
	row['ビン類区分'] = '0';
	row['逆さま厳禁区分'] = '0';
	row['下積み厳禁区分'] = '0';
	row['商品サイズ区分'] = extractSize(order[SHOPIFY_FIELDS.SHIPPING_METHOD] ?? '');
	row['速達・配達日指定種別'] = '0';
	row['配達時間帯区分'] = '00';
	row['差出方法区分'] = '0';
	row['ゆうパック複数個割引'] = '0';
	row['ゆうパック同一割引'] = '0';
	row['複数個口数'] = '1';
	row['品名'] = 'お酒'; // derive from Line Item Name when product types expand
	row['個数'] = '1';
	row['単価'] = order[SHOPIFY_FIELDS.SUBTOTAL] ?? '';
	row['金額'] = order[SHOPIFY_FIELDS.TOTAL] ?? '';

	return row;
};

export const buildYupackCsv = (rows: Record<string, string>[]): string =>
	Papa.unparse({ fields: HEADERS, data: rows });
