import urllib.request, json
try:
    token = open(r'C:\Users\Gabri\.claude\secrets\meta_token.txt').read().splitlines()[-1]
    req = urllib.request.Request(f'https://graph.facebook.com/v20.0/me/accounts?access_token={token}')
    res = json.loads(urllib.request.urlopen(req).read().decode())
    pages = res.get('data', [])
    print(f'Encontradas {len(pages)} paginas vinculadas.')
    for page in pages:
        pid = page['id']
        preq = urllib.request.Request(f'https://graph.facebook.com/v20.0/{pid}?fields=name,instagram_business_account&access_token={token}')
        pres = json.loads(urllib.request.urlopen(preq).read().decode())
        ig = pres.get('instagram_business_account', {}).get('id', 'Nenhum')
        print(f'- Pagina: {pres.get("name")} | IG Business ID: {ig}')
except Exception as e:
    import traceback
    traceback.print_exc()
