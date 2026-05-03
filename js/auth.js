import { supabase } from './supabase.js'

// Yeni kullanıcı kaydı
// Önce Supabase Auth'da hesap açar, sonra users tablosuna profil ekler.
export async function registerUser(email, password, adSoyad, telefon) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })
  if (authError) throw authError

  const { error: profileError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    ad_soyad: adSoyad,
    telefon,
    rol: 'beklemede',
    onay_durumu: 'beklemede',
  })
  if (profileError) throw profileError

  // Admin'e bildirim maili gönder
  await supabase.functions.invoke('send-email', {
    body: {
      tip: 'yeni_kayit',
      kullanici: {
        ad_soyad: adSoyad,
        email,
        telefon,
        kayit_zamani: new Date().toISOString(),
        tarayici: navigator.userAgent,
      },
    },
  })

  return authData
}

// Kullanıcı girişi
// Onay durumunu kontrol eder; onaylanmamış hesaplar oturumu hemen kapatır.
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('onay_durumu, rol, demo_kalan_hak, ad_soyad')
    .eq('id', data.user.id)
    .single()

  if (profileError) {
    await supabase.auth.signOut()
    throw new Error('Kullanıcı profili bulunamadı. Lütfen yöneticinizle iletişime geçin.')
  }

  if (profile.onay_durumu !== 'onaylandi') {
    await supabase.auth.signOut()
    const mesajlar = {
      beklemede: 'Hesabınız henüz onaylanmadı. Yöneticiniz inceleme yapacaktır.',
      reddedildi: 'Hesap başvurunuz reddedildi. Lütfen yöneticinizle iletişime geçin.',
      silindi: 'Bu hesaba erişim engellenmiştir. Lütfen yöneticinizle iletişime geçin.',
      pasif: 'Hesabınız askıya alınmıştır. Lütfen yöneticinizle iletişime geçin.',
    }
    throw new Error(mesajlar[profile.onay_durumu] || 'Giriş yapılamadı.')
  }

  // Son giriş zamanını güncelle
  await supabase
    .from('users')
    .update({ son_giris: new Date().toISOString() })
    .eq('id', data.user.id)

  return { ...data, profile }
}

// Oturumu kapat
export async function logoutUser() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Mevcut oturumu ve kullanıcı profilini döndürür
// Oturum yoksa null döner.
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  if (!profile) return null

  return { ...session.user, profile }
}

// Demo kullanıcı hak kontrolü
// Demo değilse her zaman izin verir.
// Demo ise kalan hakka bakar.
export async function checkDemoLimit(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('demo_kalan_hak, rol')
    .eq('id', userId)
    .single()

  if (error) throw error

  if (data.rol !== 'demo') return { allowed: true }
  if (data.demo_kalan_hak <= 0) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: data.demo_kalan_hak }
}

// Demo hakkını bir azalt (hesaplama kaydedilince çağrılır)
export async function decrementDemoHak(userId) {
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('demo_kalan_hak')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError
  if (user.demo_kalan_hak <= 0) throw new Error('Demo hesaplama hakkınız kalmadı.')

  const { error } = await supabase
    .from('users')
    .update({ demo_kalan_hak: user.demo_kalan_hak - 1 })
    .eq('id', userId)

  if (error) throw error
}

// Admin: kullanıcıyı onayla
// type: 'tam_kullanici' → sınırsız erişim
// type: 'demo'         → 5 hesaplama hakkı
export async function approveUser(userId, type) {
  if (type !== 'tam_kullanici' && type !== 'demo') {
    throw new Error("Geçersiz kullanıcı tipi. 'tam_kullanici' veya 'demo' olmalı.")
  }

  const { data: user, error } = await supabase
    .from('users')
    .update({
      rol: type,
      onay_durumu: 'onaylandi',
      demo_kalan_hak: type === 'demo' ? 5 : null,
    })
    .eq('id', userId)
    .select('email, ad_soyad')
    .single()

  if (error) throw error

  // Kullanıcıya onay maili gönder
  await supabase.functions.invoke('send-email', {
    body: {
      tip: 'onay_bildirimi',
      kullanici: { email: user.email, ad_soyad: user.ad_soyad },
    },
  })
}

// Admin: kullanıcıyı reddet
export async function rejectUser(userId) {
  const { data: user, error } = await supabase
    .from('users')
    .update({ onay_durumu: 'reddedildi' })
    .eq('id', userId)
    .select('email, ad_soyad')
    .single()

  if (error) throw error

  // Kullanıcıya red maili gönder
  await supabase.functions.invoke('send-email', {
    body: {
      tip: 'red_bildirimi',
      kullanici: { email: user.email, ad_soyad: user.ad_soyad },
    },
  })
}

// Admin: kullanıcıyı sil (yumuşak silme)
// Auth kaydı silinmez. Hesaplama kayıtları korunur.
// Kullanıcıya HİÇBİR bildirim gitmez.
export async function deleteUser(userId) {
  const { error } = await supabase
    .from('users')
    .update({ onay_durumu: 'silindi' })
    .eq('id', userId)

  if (error) throw error
}

// Admin: silinen kullanıcıyı tam kullanıcı olarak geri getir
export async function restoreUser(userId) {
  const { error } = await supabase
    .from('users')
    .update({ onay_durumu: 'onaylandi', rol: 'tam_kullanici' })
    .eq('id', userId)

  if (error) throw error
}

// Admin: kullanıcının yetkisini durdur (hesap aktif kalır ama giriş yapamaz)
export async function suspendUser(userId) {
  const { error } = await supabase
    .from('users')
    .update({ onay_durumu: 'pasif' })
    .eq('id', userId)

  if (error) throw error
}

// Admin: demo kullanıcının hakkını 5'e yenile
export async function renewDemoHak(userId) {
  const { error } = await supabase
    .from('users')
    .update({ demo_kalan_hak: 5 })
    .eq('id', userId)

  if (error) throw error
}
