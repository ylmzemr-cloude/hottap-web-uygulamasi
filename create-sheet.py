#!/usr/bin/env python3
"""Google Sheets test tablosu oluşturucu — python3 create-sheet.py"""
import subprocess, json, sys

BASH = r'C:\Users\misafir\AppData\Local\Programs\Git\usr\bin\bash.exe'

def gws(subcmd_list, body=None, params=None):
    import tempfile, os
    env = dict(os.environ)
    bash_cmd = 'gws ' + ' '.join(subcmd_list)
    if body:
        tf_body = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(body, tf_body, ensure_ascii=False)
        tf_body.close()
        bash_cmd += f' --json "$(cat \'{tf_body.name}\')"'
    if params:
        tf_params = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(params, tf_params)
        tf_params.close()
        bash_cmd += f' --params "$(cat \'{tf_params.name}\')"'
    r = subprocess.run([BASH, '-c', bash_cmd], capture_output=True, text=True, encoding='utf-8', env=env)
    if body:    os.unlink(tf_body.name)
    if params:  os.unlink(tf_params.name)
    if r.returncode != 0:
        print('STDERR:', r.stderr, file=sys.stderr)
        raise RuntimeError(r.stderr or 'gws hatasi')
    return json.loads(r.stdout)

def img(file_id):
    return f'=IMAGE("https://drive.google.com/thumbnail?id={file_id}%26sz=w400",2)'

# ── VERİ ──────────────────────────────────────────────────────────────────────
# [sayfa, alan, drive_file_id, ne_yapiyor]
ROWS = [
    ['Giriş Sayfası',            'Tam Sayfa',                    '1dhXrHMLMbU2zTq7v1cU5-gtI_8IU-FFX', 'Uygulamaya giriş ve kayıt ekranının genel görünümü'],
    ['Giriş Sayfası',            'Giriş Formu',                  '142AOB9lCl3faDGAglU2ytgVnOXtCO1vC', 'E-posta ve şifre ile giriş yapma formu'],
    ['Giriş Sayfası',            'Kayıt Formu',                  '17pY5LUc7ZkXCTYJ0bT5Wq5wisjx9Hswp', 'Yeni kullanıcı kayıt formu (ad-soyad, e-posta, telefon, şifre)'],
    ['Yeni Hesaplama – Adım 1',  'Tam Sayfa',                    '12Qo8a5_-6eKRAGJuqThNKIto3VCnYBTB', 'Hesaplama başlangıç ekranı: proje bilgileri ve operasyon seçimi'],
    ['Yeni Hesaplama – Adım 1',  'Proje Bilgileri Alanı',        '1_pYvgKoucZZydVRKwbpAJIXBGFx02HPX', 'Proje numarası (metin) ve operasyon tarihi (tarih seçici) girişi'],
    ['Yeni Hesaplama – Adım 1',  'Operasyon Seçimi',             '1KqKRB-vHcMCSfW4_da8WtdeIlAKBJAVh', 'HotTap, Stopple, Tapalama, Tapa Geri Alma; birden fazla seçilebilir'],
    ['Yeni Hesaplama – Adım 2',  'Tam Sayfa',                    '1EWRslV0y7haKUaSwaJF3BYywtF8BLwoF', 'Seçilen her operasyon için ayrı veri giriş kartları'],
    ['Yeni Hesaplama – Adım 2',  'HotTap Kartı',                 '1iEaekFGjWQ3Cbr0s_5aGbBexSWjfZENB', 'Boru seçimi, cutter seçimi, duvar kalınlığı, Ref1, A, B ölçü girişleri; mm/inch toggle'],
    ['Yeni Hesaplama – Adım 2',  'Stopple Kartı',                '1lh3niNIZW66JWtRcLS3XcUPDjUfyGUgh', 'Bağlı HotTap seçimi ve Ref2, D, B, E ölçü girişleri'],
    ['Yeni Hesaplama – Adım 2',  'Tapalama Kartı',               '1TZhxa8o2_uFkpw8Wo8_g9ESnHJRvNAmL', 'Bağlı HotTap seçimi ve G, H, Y/F ölçü girişleri'],
    ['Yeni Hesaplama – Adım 2',  'Tapa Geri Alma Kartı',         '19KMDh2bXz5m6BT2GsXprRrSFtvAP8TUX', 'Cutter ve HotTap seçimi, M, N, Spring travel ölçü girişleri'],
    ['Yeni Hesaplama – Adım 3',  'Tam Sayfa',                    '1YT-gx7rDVg0xx3K8BQUu7kT4AdaXrc4n', 'Hesaplama sonuçları; her operasyon için ayrı sekme + özet'],
    ['Yeni Hesaplama – Adım 3',  'Sonuç Sekmeleri (genel)',      '1DMVJO8X6s0PxaMrAEp0BZRlSfPuEkqx4', 'HotTap, Stopple, Tapalama, Geri Alma ve Özet sekmeleri arası geçiş'],
    ['Yeni Hesaplama – Adım 3',  'HotTap Sonuç Sekmesi',         '1M-w_hjMKcHNfcyr4UK3LpmdgFRDXlI9b', 'HotTap hesaplama sonuçları: giriş tablosu + hesaplanmış değerler + formüller'],
    ['Yeni Hesaplama – Adım 3',  'Stopple Sonuç Sekmesi',        '1VxHNYHopsfCJfNGLBAVHEWaogf-sllVc', 'Stopple hesaplama sonuçları tablosu'],
    ['Yeni Hesaplama – Adım 3',  'Tapalama Sonuç Sekmesi',       '1K0C62BJgakQGL_4t1ayuIsqYtSO6PyJZ', 'Tapalama hesaplama sonuçları tablosu'],
    ['Yeni Hesaplama – Adım 3',  'Geri Alma Sonuç Sekmesi',      '1wglU2nJo9XkAjAUsA5f1dU9QrzL_YTS6', 'Tapa geri alma hesaplama sonuçları tablosu'],
    ['Yeni Hesaplama – Adım 3',  'Özet Sekmesi',                 '1uPa0HfCJNc__nACmGTkJMGzdGO__98zq', 'Tüm seçili operasyonların özet tablosu (yan yana karşılaştırma)'],
    ['Yeni Hesaplama – Adım 3',  'Kaydet & PDF İndir Butonu',    '1I2ehNHW4FHj_JU9DkOv5b6MRFU32N6fn', 'Hesaplamayı kaydet ve PDF raporu oluşturup indir'],
    ['Geçmiş',                   'Tam Sayfa',                    '1qN8JnaLFTXn6C6i4MusvRQdr24iD9bzm', 'Daha önce kaydedilmiş tüm hesaplamaların listesi'],
    ['Geçmiş',                   'Hesaplama Listesi',            '1NfeJDiuQfJ8MVtMbJihWh-gFLxzKD55E', 'Her kayıt için: tarih, proje no, PDF İndir ve Revize Et butonları'],
    ['Operasyon Süresi',         'Tam Sayfa',                    '1DuG1_deitYRm4QTlpi0LvZp8ZYy3Qpec', 'T-203 ve 1200 makine tipleri için RPM ve feed rate göre süre hesaplayıcı'],
    ['Yönetici Mesajı',          'Tam Sayfa',                    '14FT9aWjDhp6sJJFh_25BR5yU6vHb8Snh', 'Kullanıcının admina mesaj gönderme ekranı'],
    ['Yönetici Mesajı',          'Mesaj Yazma Alanı',            '1sr2XpN8_kHOfz6o3wR7HlSSAZ091Z6CS', 'Serbest metin alanı ve Gönder butonu'],
    ['Admin: Bekleyen',          'Tam Sayfa',                    '1BcpzELrsx-l6c0Kr1NNMdwybrRR2ktSy', 'Admin onayı bekleyen yeni kayıt başvurularının listesi'],
    ['Admin: Bekleyen',          'Başvuru Listesi',              '1xDHfJy5p0Mnf_-tjkC1R_Rho8mlE5slE', 'Her başvuru için kullanıcı bilgileri, Onayla ve Reddet butonları'],
    ['Admin: Kullanıcılar',      'Tam Sayfa',                    '1RYJvWWT2MOtGjsCyA9PBqfhCJ88lWeHr', 'Tüm kayıtlı kullanıcılar; demo hesap yenileme ve tam hesaba yükseltme'],
    ['Admin: Hesaplamalar',      'Tam Sayfa',                    '1xGn7eY4GuxbGGKZeQv7wP8VU9BOEGsNm', 'Sistemdeki tüm kullanıcıların hesaplamaları; PDF indirme seçeneği'],
    ['Admin: Tablolar',          'Tam Sayfa',                    '1N9ZvynAgsG3hbD3-JOlqAoh_va8FKt_f', 'Boru, cutter ve yay tablo verilerini düzenleme ekranı (sekme bazlı)'],
    ['Admin: Görünürlük',        'Tam Sayfa',                    '1omQ6-CwAu4QPLCh3KhARB2pG3-97kkgI', 'Kullanıcılara hangi sonuç alanlarının gösterileceğini belirleme paneli'],
    ['Admin: Görünürlük',        'Görünürlük Paneli',            '1r6sY5QOrUR15TeReCYQ9xjT5bt6ygtQR', '4 sutun: Ekran-Ozet, Ekran-Sonuc, PDF-Giris, PDF-Sonuc; her alan icin toggle'],
]

def main():
    # 1. Spreadsheet olustur
    print('Spreadsheet olusturuluyor...')
    created = gws(
        ['sheets', 'spreadsheets', 'create'],
        body={'properties': {'title': 'HotTap - Uygulama Test Tablosu'}}
    )
    sheet_id  = created['spreadsheetId']
    sheet_gid = created['sheets'][0]['properties']['sheetId']
    print(f'  ID: {sheet_id}')

    # 2. Verileri yaz
    print('Veriler yaziliyor...')
    header = [['#', 'Sayfa', 'Alan / Bilesen', 'Ekran Resmi', 'Ne Yapiyor', 'Durum', 'Notlar']]
    data_rows = [[i+1, r[0], r[1], img(r[2]), r[3], '', ''] for i, r in enumerate(ROWS)]
    all_rows = header + data_rows

    gws(
        ['sheets', 'spreadsheets', 'values', 'batchUpdate'],
        body={'valueInputOption': 'USER_ENTERED', 'data': [{'range': 'A1', 'values': all_rows}]},
        params={'spreadsheetId': sheet_id}
    )

    # 3. Bicimlendirme
    print('Bicimlendirme uygulanıyor...')
    row_count = len(all_rows)
    gws(
        ['sheets', 'spreadsheets', 'batchUpdate'],
        body={'requests': [
            # Baslik: koyu mavi zemin, beyaz kalin yazi
            {'repeatCell': {
                'range': {'sheetId': sheet_gid, 'startRowIndex': 0, 'endRowIndex': 1},
                'cell': {'userEnteredFormat': {
                    'backgroundColor': {'red': 0.13, 'green': 0.27, 'blue': 0.53},
                    'textFormat': {'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}, 'bold': True, 'fontSize': 11},
                    'horizontalAlignment': 'CENTER', 'verticalAlignment': 'MIDDLE'
                }},
                'fields': 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
            }},
            # Veri satirlari: dikey ortala, kelime kaydır
            {'repeatCell': {
                'range': {'sheetId': sheet_gid, 'startRowIndex': 1, 'endRowIndex': row_count},
                'cell': {'userEnteredFormat': {'verticalAlignment': 'MIDDLE', 'wrapStrategy': 'WRAP'}},
                'fields': 'userEnteredFormat(verticalAlignment,wrapStrategy)'
            }},
            # Resim sutunu: yatay ortala
            {'repeatCell': {
                'range': {'sheetId': sheet_gid, 'startRowIndex': 1, 'endRowIndex': row_count, 'startColumnIndex': 3, 'endColumnIndex': 4},
                'cell': {'userEnteredFormat': {'horizontalAlignment': 'CENTER'}},
                'fields': 'userEnteredFormat(horizontalAlignment)'
            }},
            # Durum sutunu: acik yesil
            {'repeatCell': {
                'range': {'sheetId': sheet_gid, 'startRowIndex': 1, 'endRowIndex': row_count, 'startColumnIndex': 5, 'endColumnIndex': 6},
                'cell': {'userEnteredFormat': {'backgroundColor': {'red': 0.9, 'green': 0.98, 'blue': 0.9}}},
                'fields': 'userEnteredFormat(backgroundColor)'
            }},
            # Notlar sutunu: acik sari
            {'repeatCell': {
                'range': {'sheetId': sheet_gid, 'startRowIndex': 1, 'endRowIndex': row_count, 'startColumnIndex': 6, 'endColumnIndex': 7},
                'cell': {'userEnteredFormat': {'backgroundColor': {'red': 1, 'green': 0.98, 'blue': 0.88}}},
                'fields': 'userEnteredFormat(backgroundColor)'
            }},
            # Baslik satiri yuksekligi
            {'updateDimensionProperties': {
                'range': {'sheetId': sheet_gid, 'dimension': 'ROWS', 'startIndex': 0, 'endIndex': 1},
                'properties': {'pixelSize': 40}, 'fields': 'pixelSize'
            }},
            # Veri satirlari yuksekligi
            {'updateDimensionProperties': {
                'range': {'sheetId': sheet_gid, 'dimension': 'ROWS', 'startIndex': 1, 'endIndex': row_count},
                'properties': {'pixelSize': 220}, 'fields': 'pixelSize'
            }},
            # Kolon genislikleri
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 0, 'endIndex': 1}, 'properties': {'pixelSize': 40},  'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 1, 'endIndex': 2}, 'properties': {'pixelSize': 190}, 'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 2, 'endIndex': 3}, 'properties': {'pixelSize': 220}, 'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 3, 'endIndex': 4}, 'properties': {'pixelSize': 370}, 'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 4, 'endIndex': 5}, 'properties': {'pixelSize': 320}, 'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 5, 'endIndex': 6}, 'properties': {'pixelSize': 120}, 'fields': 'pixelSize'}},
            {'updateDimensionProperties': {'range': {'sheetId': sheet_gid, 'dimension': 'COLUMNS', 'startIndex': 6, 'endIndex': 7}, 'properties': {'pixelSize': 250}, 'fields': 'pixelSize'}},
            # Baslik satirini dondur
            {'updateSheetProperties': {
                'properties': {'sheetId': sheet_gid, 'gridProperties': {'frozenRowCount': 1}},
                'fields': 'gridProperties.frozenRowCount'
            }},
        ]},
        params={'spreadsheetId': sheet_id}
    )

    print(f'\nTablo hazir!')
    print(f'  https://docs.google.com/spreadsheets/d/{sheet_id}')

if __name__ == '__main__':
    main()
