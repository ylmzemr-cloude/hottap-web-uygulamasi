$env:SUPABASE_ACCESS_TOKEN = (Get-Content 'C:\Users\misafir\AppData\Roaming\supabase\access-token' -Raw).Trim()
Set-Location 'D:\claude_projeleri\hottap-web-uygulaması'
& 'C:\Users\misafir\scoop\shims\supabase.exe' functions deploy send-email --project-ref vjmkevcunopwubniffbn
