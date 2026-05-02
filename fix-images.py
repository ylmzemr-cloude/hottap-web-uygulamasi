#!/usr/bin/env python3
"""Spreadsheet'teki IMAGE formüllerini düzelt"""
import subprocess, json, tempfile, os

BASH = r'C:\Users\misafir\AppData\Local\Programs\Git\usr\bin\bash.exe'
SHEET_ID = '1mwpdfmDgoCxywh2FkmPyA7JueV8OZ8C7O0PfIsfKT48'

def gws_bash(subcmd_list, body=None, params=None):
    bash_cmd = 'gws ' + ' '.join(subcmd_list)
    tf_body = tf_params = None
    if body:
        tf_body = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(body, tf_body, ensure_ascii=False)
        tf_body.close()
        bash_cmd += f" --json \"$(cat '{tf_body.name}')\""
    if params:
        tf_params = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8')
        json.dump(params, tf_params)
        tf_params.close()
        bash_cmd += f" --params \"$(cat '{tf_params.name}')\""
    r = subprocess.run([BASH, '-c', bash_cmd], capture_output=True, text=True, encoding='utf-8')
    if tf_body:   os.unlink(tf_body.name)
    if tf_params: os.unlink(tf_params.name)
    if r.returncode != 0:
        raise RuntimeError(r.stderr or 'gws hatasi')
    return json.loads(r.stdout)

# Drive file ID → satır sırası (ROWS listesiyle aynı sıra)
FILE_IDS = [
    '1GLF1Lxnbqc-1T0jLny9egbgZ8vgMtdA_',  # 01-giris__tam-sayfa
    '1rwbuL8aeTOfOLEXP8uo0znuYQLZZkfP9',  # 01-giris__giris-formu
    '1uHyf41VYB5mEIiTwDGLqDywCHd4dKPrt',  # 01-giris__kayit-formu
    '1gL6eNwxoaYk2-MsAjm-zswoLBn0YOQIr',  # 02-adim1__tam-sayfa
    '1h91qCL1BDMKdomRbHqf2MR9jukg2lEjS',  # 02-adim1__proje-bilgileri
    '1Fr4Mzq8vDZn77bDqxtAJiHIziEbltH1_',  # 02-adim1__operasyon-secimi
    '1vMVTkEyDcxPLkHv3PuT5EG-y9_rlScYe',  # 03-adim2__tam-sayfa
    '1yoBoujXapAusvz9DdjgC_fOXXYiRHoqD',  # 03-adim2__kart-hottap
    '1bBrO-6ujN98n-3YnBY9DmF1GWyWUgxaN',  # 03-adim2__kart-stopple
    '13PO4j9z6MF-9rsQUt87sfWbME3_vTqFQ',  # 03-adim2__kart-tapalama
    '1ZxZ6tmd8R8BJvrQ60JzLAieNphX-Rqm0',  # 03-adim2__kart-geri-alma
    '1KFjOTWgKCWGNlsJWn1h7tJUMFYmeCMvQ',  # 04-adim3__tam-sayfa
    '1UgZsykABR7-buWDRdwGdtFOipaa4RLHn',  # 04-adim3__sonuc-sekmeler
    '1PxTCP3_Nz8u-R66oQr5zCOm8Iu-xr7vN',  # 04-adim3__sekme-1-ht
    '1iLxWHF9iGK13z2wXmp7ETV7E_5ytu2y5',  # 04-adim3__sekme-2-st
    '1-P80-HqUlQNRUppN0qg1cE2lrPMiy9h8',  # 04-adim3__sekme-3-tp
    '1gcMkRqXt33ExUEOpM_3f051uDVGoGjDY',  # 04-adim3__sekme-4-ga
    '1AUNTEmT-t9Lcd4Hggn-e6egcbiaZrWfz',  # 04-adim3__sekme-5-ozet
    '1kNA3vRKu932ozcfjX_8UoUL2Zy64tucD',  # 04-adim3__kaydet-pdf
    '1mbSFKy-Azc8BobD-hbTAXh6StklOuL1n',  # 05-gecmis__tam-sayfa
    '1UfTZjxFQB5PuhBOIIoQpfFXKkIZB43AE',  # 05-gecmis__liste
    '1piQi-2Scx6AbMSoViHhPlePtQAjy322s',  # 06-op-suresi__tam-sayfa
    '1wri_BYKXPnJc15hKaPHsB6MknZm6qoY3',  # 07-mesaj__tam-sayfa
    '1dhtKX-98A4JYrs8Bn56UJuFhJca5b_R4',  # 07-mesaj__mesaj-alani
    '19Oq6dmINN8m5YjuFUvoDiIyZYbvPGksk',  # 08-admin-bekleyen__tam-sayfa
    '1L6RNVXpXmZ80yYfjefG4I-ypDnfOg0m2',  # 08-admin-bekleyen__liste
    '1pRW-AXR3JNtO-pV-Us5d_bB_LDYtX1yh',  # 09-admin-kullanicilar
    '1mTjyLIghY9mj3ntgDNVysbopscl8ZZER',  # 10-admin-hesaplamalar
    '1Mz-Gr8yvdFE9RLl8EMfsCg1NIykIEfgB',  # 11-admin-tablolar
    '11FK-ocT8J9C2QLz8WhEiGIDHl3I03SVP',  # 12-admin-gorunum__tam-sayfa
    '14a1l15p0CGhfNTiftZ0RzbZjyaejHWX_',  # 12-admin-gorunum__panel
]

# D sütunu için yeni formüller (satır 2'den başlıyor)
new_values = [[f'=IMAGE("https://drive.google.com/uc?export=view&id={fid}")'] for fid in FILE_IDS]

print('IMAGE formülleri güncelleniyor...')
gws_bash(
    ['sheets', 'spreadsheets', 'values', 'update'],
    body={'values': new_values, 'majorDimension': 'ROWS'},
    params={'spreadsheetId': SHEET_ID, 'range': f'D2:D{1+len(FILE_IDS)}', 'valueInputOption': 'USER_ENTERED'}
)
print(f'Bitti! {len(FILE_IDS)} resim formülü güncellendi.')
print(f'Spreadsheet: https://docs.google.com/spreadsheets/d/{SHEET_ID}')
