import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';

import {
  createClient
} from '@supabase/supabase-js';

import { z } from 'zod';


/* =========================================================
   CONFIG
========================================================= */

const {
  PORT = 4000,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY
} = process.env;

if (
  !SUPABASE_URL ||
  !SUPABASE_PUBLISHABLE_KEY
) {
  console.error(
    'SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY wajib diisi di backend/.env'
  );

  process.exit(1);
}


/* =========================================================
   EXPRESS
========================================================= */

const app = express();

app.use(
  helmet()
);

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  morgan('dev')
);


/* =========================================================
   MULTER
========================================================= */

const upload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      fileSize:
        3 * 1024 * 1024
    },

    fileFilter(
      req,
      file,
      cb
    ) {
      const allowed = [
        'image/jpeg',
        'image/png',
        'image/webp'
      ];

      if (
        !allowed.includes(
          file.mimetype
        )
      ) {
        return cb(
          new Error(
            'Format gambar harus JPG, PNG, atau WEBP.'
          )
        );
      }

      cb(
        null,
        true
      );
    }
  });


/* =========================================================
   SUPABASE
========================================================= */

const supabase =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

// Admin client (service_role) — bypasses RLS, used for auto-confirm & profile creation
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    )
  : null;


const db =
  (token) =>
    createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        },

        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );


/* =========================================================
   ZOD SCHEMA
========================================================= */

const loginSchema =
  z.object({
    email:
      z.email(),

    password:
      z.string()
        .min(6)
  });


const signupSchema =
  z.object({
    fullName:
      z.string()
        .min(2)
        .max(80),

    email:
      z.email(),

    password:
      z.string()
        .min(6)
        .max(100)
  });


const profileSchema =
  z.object({
    fullName:
      z.string()
        .min(2)
        .max(80),

    phone:
      z.string()
        .max(30)
        .optional()
        .nullable(),

    address:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90)
        .optional()
        .nullable(),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180)
        .optional()
        .nullable()
  });


/* =========================================================
   ORDER ITEM SCHEMA
========================================================= */

const orderItemSchema =
  z.object({
    menuId:
      z.coerce
        .number()
        .int()
        .positive(),

    quantity:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(99),

    spiceLevel:
      z.enum([
        'tidak_pedas',
        'sedang',
        'pedas',
        'extra_pedas'
      ])
      .default(
        'sedang'
      ),

    notes:
      z.string()
        .max(200)
        .optional()
        .nullable()
  });


/* =========================================================
   CUSTOMER ORDER
========================================================= */

const orderSchema =
  z.object({
    customerName:
      z.string()
        .max(80)
        .optional()
        .nullable(),

    customerPhone:
      z.string()
        .max(30)
        .optional()
        .nullable(),

    address:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90)
        .optional()
        .nullable(),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180)
        .optional()
        .nullable(),

    orderNotes:
      z.string()
        .max(300)
        .optional()
        .nullable(),

    salesChannel:
      z.enum([
        'website',
        'offline',
        'shopeefood'
      ])
      .default('website'),

    paymentMethod:
      z.enum([
        'cash',
        'qris',
        'transfer'
      ]),

    items:
      z.array(
        orderItemSchema
      )
      .min(1)
  });


/* =========================================================
   MANUAL CASHIER ORDER
========================================================= */

const manualOrderSchema =
  orderSchema.extend({
    customerId:
      z.string()
        .uuid()
        .optional()
        .nullable(),

    salesChannel:
      z.enum([
        'offline',
        'shopeefood'
      ])
      .default('offline'),

    paymentStatus:
      z.literal(
        'paid'
      )
      .default(
        'paid'
      )
  });


/* =========================================================
   MENU SCHEMA
========================================================= */

const menuSchema =
  z.object({
    categoryId:
      z.coerce
        .number()
        .int()
        .positive(),

    name:
      z.string()
        .min(2)
        .max(100),

    description:
      z.string()
        .max(500)
        .optional()
        .nullable(),

    price:
      z.coerce
        .number()
        .positive(),

    isActive:
      z.preprocess(
        (value) =>
          typeof value ===
          'boolean'
            ? value
            : String(value)
                .toLowerCase() ===
              'true',

        z.boolean()
      )
  });


/* =========================================================
   STATUS SCHEMA
========================================================= */

const statusSchema =
  z.object({
    status:
      z.enum([
        'pending',
        'confirmed',
        'preparing',
        'ready',
        'completed',
        'cancelled'
      ])
  });


/* =========================================================
   CATEGORY SCHEMA
========================================================= */

const categorySchema =
  z.object({
    name:
      z.string()
        .min(2, 'Nama kategori minimal 2 karakter')
        .max(50, 'Nama kategori maksimal 50 karakter'),

    slug:
      z.string()
        .max(60)
        .optional()
        .nullable(),

    icon:
      z.string()
        .max(30)
        .optional()
        .nullable(),

    isActive:
      z.preprocess(
        (value) =>
          typeof value === 'boolean'
            ? value
            : String(value).toLowerCase() === 'true',
        z.boolean()
      ).default(true),

    sortOrder:
      z.coerce
        .number()
        .int()
        .optional()
        .default(0)
  });


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function auth(
  req,
  res,
  next
) {
  try {
    const token =
      (
        req.headers
          .authorization ||
        ''
      )
      .replace(
        /^Bearer\s+/i,
        ''
      )
      .trim();

    if (!token) {
      return res
        .status(401)
        .json({
          error:
            'Authentication diperlukan.'
        });
    }

    const {
      data: userData,
      error: userError
    } =
      await supabase.auth.getUser(
        token
      );

    if (
      userError ||
      !userData?.user
    ) {
      return res
        .status(401)
        .json({
          error:
            'Token tidak valid atau kadaluarsa.'
        });
    }

    const client =
      db(token);

    const {
      data: profile,
      error: profileError
    } =
      await client
        .from('profiles')
        .select(
          `
            id,
            full_name,
            phone,
            address,
            latitude,
            longitude,
            role,
            created_at
          `
        )
        .eq(
          'id',
          userData.user.id
        )
        .maybeSingle();

    let userProfile = profile;

    if (!userProfile) {
      const fallbackName =
        userData.user.user_metadata?.full_name ||
        userData.user.email?.split('@')[0] ||
        'Pelanggan';

      if (supabaseAdmin) {
        const { data: adminCreated } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userData.user.id,
            full_name: fallbackName,
            role: 'customer'
          }, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (adminCreated) {
          userProfile = adminCreated;
        }
      }

      if (!userProfile) {
        const { data: createdProfile } = await client
          .from('profiles')
          .insert({
            id: userData.user.id,
            full_name: fallbackName,
            role: 'customer'
          })
          .select('*')
          .maybeSingle();

        userProfile = createdProfile || {
          id: userData.user.id,
          full_name: fallbackName,
          phone: null,
          address: null,
          latitude: null,
          longitude: null,
          role: 'customer',
          created_at: userData.user.created_at || new Date().toISOString()
        };
      }
    }

    if (userProfile) {
      userProfile.role = userProfile.role === 'cashier' ? 'cashier' : 'customer';
    }

    req.user = userData.user;
    req.profile = userProfile;

    req.db =
      client;

    req.token =
      token;

    next();

  } catch (error) {
    next(error);
  }
}


/* =========================================================
   ROLE
========================================================= */

const allow =
  (...roles) =>
  (
    req,
    res,
    next
  ) => {
    if (
      !roles.includes(
        req.profile?.role
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            'Role tidak memiliki akses.'
        });
    }

    next();
  };


/* =========================================================
   AUDIT
========================================================= */

const audit =
  async (
    req,
    action,
    entity,
    entity_id,
    meta = {}
  ) => {

    const {
      error
    } =
      await req.db
        .from(
          'audit_logs'
        )
        .insert({
          actor_id:
            req.user.id,

          action,

          entity,

          entity_id,

          meta
        });

    if (error) {
      console.error(
        'Audit log error:',
        error
      );
    }
  };


/* =========================================================
   HEALTH
========================================================= */

app.get(
  '/api/health',
  (
    req,
    res
  ) => {
    res.json({
      ok: true,
      service:
        'Ayam Geprek Dapoer Sari',
      time:
        new Date()
          .toISOString()
    });
  }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
  '/api/auth/login',
  async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      if (!email || !password) {
        return res.status(400).json({
          error: 'Silakan isi email dan kata sandi.'
        });
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let msg = error.message || '';
        let code = error.code || '';

        if (code === 'email_not_confirmed' || msg.toLowerCase().includes('email not confirmed')) {
          if (supabaseAdmin) {
            try {
              const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
              const foundUser = userList?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
              if (foundUser) {
                await supabaseAdmin.auth.admin.updateUserById(foundUser.id, { email_confirm: true });
                const retry = await supabase.auth.signInWithPassword({ email, password });
                if (retry.data?.session) {
                  data = retry.data;
                  error = null;
                }
              }
            } catch (autoErr) {
              console.warn('Auto-confirm saat login gagal:', autoErr.message);
            }
          }
        }

        if (error) {
          if (code === 'email_not_confirmed' || msg.toLowerCase().includes('email not confirmed')) {
            return res.status(403).json({
              code: 'email_not_confirmed',
              error: 'Verifikasi email diperlukan. Silakan periksa kotak masuk atau spam email Anda untuk mengonfirmasi akun sebelum masuk.'
            });
          }

          if (msg.toLowerCase().includes('invalid login credentials') || msg.toLowerCase().includes('invalid credentials')) {
            return res.status(401).json({
              error: 'Email atau kata sandi salah. Silakan periksa kembali kredensial Anda.'
            });
          }

          return res.status(401).json({ error: msg });
        }
      }

      const client = db(data.session.access_token);

      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select(
          `
            id,
            full_name,
            phone,
            address,
            latitude,
            longitude,
            role,
            created_at
          `
        )
        .eq('id', data.user.id)
        .maybeSingle();

      let userProfile = profile;

      if (!userProfile) {
        const fallbackName =
          data.user.user_metadata?.full_name ||
          email.split('@')[0] ||
          'Pelanggan';

        if (supabaseAdmin) {
          const { data: adminCreated } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: fallbackName,
              role: 'customer'
            }, { onConflict: 'id' })
            .select('*')
            .maybeSingle();

          if (adminCreated) {
            userProfile = adminCreated;
          }
        }

        if (!userProfile) {
          const { data: createdProfile } = await client
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fallbackName,
              role: 'customer'
            })
            .select('*')
            .maybeSingle();

          userProfile = createdProfile || {
            id: data.user.id,
            full_name: fallbackName,
            phone: null,
            address: null,
            latitude: null,
            longitude: null,
            role: 'customer',
            created_at: data.user.created_at || new Date().toISOString()
          };
        }
      }

      // Registrasi dan akun selalu terdeteksi sebagai 1 peran tunggal: 'customer' (atau 'cashier' untuk staf)
      if (userProfile) {
        userProfile.role = userProfile.role === 'cashier' ? 'cashier' : 'customer';
      }

      res.json({
        session: data.session,
        user: data.user,
        profile: userProfile
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   REGISTER
========================================================= */

app.post(
  '/api/auth/signup',
  async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const fullName = String(req.body.fullName || '').trim();
      const password = String(req.body.password || '');

      if (!fullName || fullName.length < 2) {
        return res.status(400).json({
          error: 'Nama lengkap minimal 2 karakter.'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Format email tidak valid.'
        });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({
          error: 'Kata sandi minimal 6 karakter.'
        });
      }

      // --- Step 1: Daftarkan user ---
      let userId;
      let userData = null;
      let initialSession = null;

      if (supabaseAdmin) {
        // Jika ada service role key, langsung buat user dengan email_confirm: true
        const { data: adminUser, error: adminCreateError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName }
        });

        if (adminCreateError) {
          let msg = adminCreateError.message || '';
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('unique')) {
            msg = 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.';
          }
          return res.status(400).json({ error: msg });
        }

        userData = adminUser.user;
        userId = userData.id;

        // Auto-create profil di public.profiles via admin (bypass RLS)
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: userId,
            full_name: fullName,
            role: 'customer'
          }, { onConflict: 'id' });
      } else {
        // Standard signUp
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (signupError) {
          let msg = signupError.message || '';
          if (msg.toLowerCase().includes('rate limit')) {
            msg = 'Batas pengiriman email verifikasi tercapai untuk sementara. Silakan coba lagi beberapa saat lagi.';
          } else if (msg.toLowerCase().includes('already registered')) {
            msg = 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.';
          }
          return res.status(400).json({ error: msg });
        }

        if (signupData.user && (!signupData.user.identities || signupData.user.identities.length === 0)) {
          return res.status(400).json({
            error: 'Email ini sudah terdaftar. Silakan masuk menggunakan kata sandi Anda.'
          });
        }

        userData = signupData.user;
        userId = userData.id;
        initialSession = signupData.session;
      }

      // --- Step 2: Auto-confirm email jika admin tersedia tapi user dibuat via signup ---
      if (supabaseAdmin && userId) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            email_confirm: true
          });
        } catch (confirmErr) {
          console.warn('Auto-confirm gagal (non-fatal):', confirmErr.message);
        }
      }

      // --- Step 3: Login otomatis setelah registrasi ---
      let session = initialSession;
      let loggedUser = userData;

      if (!session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginData?.session) {
          session = loginData.session;
          loggedUser = loginData.user || loggedUser;
        } else if (loginError) {
          const msg = loginError.message || '';
          const code = loginError.code || '';
          if (code === 'email_not_confirmed' || msg.toLowerCase().includes('email not confirmed')) {
            return res.status(403).json({
              code: 'email_not_confirmed',
              session: null,
              user: userData,
              profile: null,
              requiresEmailVerification: true,
              error: 'Akun Anda berhasil tersimpan di Supabase! Namun verifikasi email masih aktif pada proyek Supabase. Silakan matikan toggle "Confirm email" di Supabase Dashboard (Authentication > Providers > Email) agar akun customer dapat langsung masuk ke dashboard.'
            });
          }
          return res.status(400).json({ error: msg });
        }
      }

      if (!session) {
        return res.status(201).json({
          session: null,
          user: userData,
          profile: null,
          requiresEmailVerification: true,
          message: 'Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi, lalu masuk menggunakan kata sandi yang telah didaftarkan.'
        });
      }

      // --- Step 4: Ambil atau simpan profil customer ke DB ---
      const client = db(session.access_token);
      let { data: profile } = await client
        .from('profiles')
        .select('id, full_name, phone, address, latitude, longitude, role, created_at')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        const { data: createdProfile } = await client
          .from('profiles')
          .insert({
            id: userId,
            full_name: fullName,
            role: 'customer'
          })
          .select('*')
          .maybeSingle();

        profile = createdProfile;
      }

      const userProfile = profile || {
        id: userId,
        full_name: fullName,
        phone: null,
        address: null,
        latitude: null,
        longitude: null,
        role: 'customer',
        created_at: loggedUser.created_at || new Date().toISOString()
      };

      // Registrasi akun baru selalu terdeteksi sebagai 1 peran tunggal saja: customer
      userProfile.role = 'customer';

      res.status(201).json({
        session,
        user: loggedUser,
        profile: userProfile,
        requiresEmailVerification: false,
        message: 'Registrasi berhasil! Selamat datang di Ayam Geprek Dapoer Sari.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   RESEND EMAIL VERIFICATION
========================================================= */

app.post(
  '/api/auth/resend-verification',
  async (req, res, next) => {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Alamat email wajib diisi.' });
      }

      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        let msg = error.message || '';
        if (msg.toLowerCase().includes('rate limit')) {
          msg = 'Batas pengiriman email tercapai. Silakan tunggu beberapa saat lagi sebelum mencoba kembali.';
        }
        return res.status(400).json({ error: msg });
      }

      res.json({
        ok: true,
        message: 'Tautan verifikasi telah berhasil dikirim ulang ke ' + email + '. Silakan periksa kotak masuk atau folder spam email Anda.'
      });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   CURRENT USER
========================================================= */

app.get(
  '/api/me',
  auth,
  (
    req,
    res
  ) => {

    res.json({

      user: {
        id:
          req.user.id,

        email:
          req.user.email
      },

      profile:
        req.profile
    });

  }
);


/* =========================================================
   CUSTOMER PROFILE
========================================================= */

app.put(
  '/api/profile',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const parsed =
        profileSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data profil tidak valid.',

            details:
              parsed.error.flatten()
          });
      }

      const {
        data,
        error
      } =
        await req.db
          .from(
            'profiles'
          )
          .update({
            full_name:
              parsed.data.fullName,

            phone:
              parsed.data.phone ||
              null,

            address:
              parsed.data.address ||
              null,

            latitude:
              parsed.data.latitude ??
              null,

            longitude:
              parsed.data.longitude ??
              null
          })
          .eq(
            'id',
            req.user.id
          )
          .select(
            `
              id,
              full_name,
              phone,
              address,
              latitude,
              longitude,
              role,
              created_at
            `
          )
          .single();

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data
      );

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   CATEGORIES (CUSTOMER + CASHIER MANAGEMENT)
========================================================= */

// In-memory / dynamic metadata store for category fields (icon, slug, status, sortOrder)
// if Supabase schema only stores (id, name, created_at)
const categoryMetaStore = new Map();

// Helper to generate a slug
function toSlug(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 1. Customer categories (only active categories)
app.get(
  '/api/categories',
  auth,
  async (req, res, next) => {
    try {
      const { data, error } = await req.db
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Enrich with metadata and filter active ones
      const enriched = (data || []).map((cat) => {
        const meta = categoryMetaStore.get(Number(cat.id)) || {};
        return {
          id: cat.id,
          name: cat.name,
          slug: meta.slug || toSlug(cat.name),
          icon: meta.icon || 'Utensils',
          status: meta.status || 'active',
          sortOrder: typeof meta.sortOrder === 'number' ? meta.sortOrder : 0
        };
      }).filter((cat) => cat.status === 'active');

      // Sort by sortOrder, then by name
      enriched.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

      res.json(enriched);
    } catch (error) {
      next(error);
    }
  }
);

// 2. Cashier categories list (includes menuCount, active & inactive)
app.get(
  '/api/cashier/categories',
  auth,
  allow('cashier'),
  async (req, res, next) => {
    try {
      const [catsRes, menuRes] = await Promise.all([
        req.db.from('categories').select('id, name').order('name'),
        req.db.from('menu').select('id, category_id')
      ]);

      if (catsRes.error) {
        return res.status(400).json({ error: catsRes.error.message });
      }

      // Count menu items per category
      const countMap = {};
      (menuRes.data || []).forEach((m) => {
        const cid = Number(m.category_id);
        countMap[cid] = (countMap[cid] || 0) + 1;
      });

      const list = (catsRes.data || []).map((cat) => {
        const meta = categoryMetaStore.get(Number(cat.id)) || {};
        return {
          id: cat.id,
          name: cat.name,
          slug: meta.slug || toSlug(cat.name),
          icon: meta.icon || 'Utensils',
          status: meta.status || 'active',
          sortOrder: typeof meta.sortOrder === 'number' ? meta.sortOrder : 0,
          menuCount: countMap[Number(cat.id)] || 0
        };
      });

      list.sort((a, b) => (a.sortOrder - b.sortOrder) || a.name.localeCompare(b.name));

      res.json(list);
    } catch (error) {
      next(error);
    }
  }
);

// 3. Create category
app.post(
  '/api/cashier/categories',
  auth,
  allow('cashier'),
  async (req, res, next) => {
    try {
      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Data kategori tidak valid.',
          details: parsed.error.flatten()
        });
      }

      const { name, icon, slug, isActive, sortOrder } = parsed.data;

      // Check duplicate name
      const { data: existing } = await req.db
        .from('categories')
        .select('id, name')
        .ilike('name', name.trim())
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          error: `Kategori "${name.trim()}" sudah ada.`
        });
      }

      const { data, error } = await req.db
        .from('categories')
        .insert({ name: name.trim() })
        .select('id, name')
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      // Store metadata
      const catId = Number(data.id);
      const catSlug = slug ? toSlug(slug) : toSlug(data.name);
      categoryMetaStore.set(catId, {
        slug: catSlug,
        icon: icon || 'Utensils',
        status: isActive ? 'active' : 'inactive',
        sortOrder: sortOrder || 0
      });

      await audit(req, 'CREATE_CATEGORY', 'categories', data.id, { name: data.name });

      res.status(201).json({
        id: data.id,
        name: data.name,
        slug: catSlug,
        icon: icon || 'Utensils',
        status: isActive ? 'active' : 'inactive',
        sortOrder: sortOrder || 0,
        menuCount: 0
      });
    } catch (error) {
      next(error);
    }
  }
);

// 4. Update category
app.put(
  '/api/cashier/categories/:id',
  auth,
  allow('cashier'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID kategori tidak valid.' });
      }

      const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Data kategori tidak valid.',
          details: parsed.error.flatten()
        });
      }

      const { name, icon, slug, isActive, sortOrder } = parsed.data;

      // Check if duplicate name on another category
      const { data: duplicate } = await req.db
        .from('categories')
        .select('id')
        .ilike('name', name.trim())
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        return res.status(400).json({
          error: `Kategori "${name.trim()}" sudah digunakan.`
        });
      }

      const { data, error } = await req.db
        .from('categories')
        .update({ name: name.trim() })
        .eq('id', id)
        .select('id, name')
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const catSlug = slug ? toSlug(slug) : toSlug(data.name);
      categoryMetaStore.set(id, {
        slug: catSlug,
        icon: icon || 'Utensils',
        status: isActive ? 'active' : 'inactive',
        sortOrder: sortOrder || 0
      });

      await audit(req, 'UPDATE_CATEGORY', 'categories', data.id, { name: data.name });

      res.json({
        id: data.id,
        name: data.name,
        slug: catSlug,
        icon: icon || 'Utensils',
        status: isActive ? 'active' : 'inactive',
        sortOrder: sortOrder || 0
      });
    } catch (error) {
      next(error);
    }
  }
);

// 5. Delete category with safety check
app.delete(
  '/api/cashier/categories/:id',
  auth,
  allow('cashier'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID kategori tidak valid.' });
      }

      // Check if category is used by any menu items
      const { data: menuList, error: menuErr } = await req.db
        .from('menu')
        .select('id, name')
        .eq('category_id', id);

      if (menuErr) {
        return res.status(400).json({ error: menuErr.message });
      }

      if (menuList && menuList.length > 0) {
        return res.status(400).json({
          error: `Tidak dapat menghapus kategori karena masih digunakan oleh ${menuList.length} menu. Silakan pindahkan menu ke kategori lain terlebih dahulu.`,
          menuCount: menuList.length
        });
      }

      const { error: delError } = await req.db
        .from('categories')
        .delete()
        .eq('id', id);

      if (delError) {
        return res.status(400).json({ error: delError.message });
      }

      categoryMetaStore.delete(id);
      await audit(req, 'DELETE_CATEGORY', 'categories', id);

      res.json({ success: true, message: 'Kategori berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
);

/* =========================================================
   VARIATION GROUPS & OPTIONS (CUSTOMER + CASHIER)
========================================================= */

let variationGroupsStore = [
  {
    id: 'spice_level',
    name: 'Level Pedas',
    description: 'Pedasnya mau seberapa? 🌶',
    type: 'single',
    required: true,
    status: 'active',
    sortOrder: 1,
    options: [
      { id: 'tidak_pedas', name: 'Tidak Pedas', icon: '🌿', price: 0, desc: 'Tanpa sambal pedas', status: 'active', sortOrder: 1 },
      { id: 'sedang', name: 'Sedang', icon: '🔥', price: 0, desc: 'Sedikit pedas, cocok semua', status: 'active', sortOrder: 2 },
      { id: 'pedas', name: 'Pedas', icon: '🔥🔥', price: 1000, desc: 'Pedas nampol!', status: 'active', sortOrder: 3 },
      { id: 'extra_pedas', name: 'Extra Pedas', icon: '🔥🔥🔥', price: 2000, desc: 'Berani pedas banget?', status: 'active', sortOrder: 4 },
    ]
  },
  {
    id: 'toppings',
    name: 'Pilih Topping',
    description: 'Tambah topping favoritmu!',
    type: 'multiple',
    required: false,
    status: 'active',
    sortOrder: 2,
    options: [
      { id: 'cheese', name: 'Keju', icon: '🧀', price: 4000, desc: '', status: 'active', sortOrder: 1 },
      { id: 'mayonnaise', name: 'Mayonaise', icon: '🥛', price: 3000, desc: '', status: 'active', sortOrder: 2 },
      { id: 'hot_lava', name: 'Hot Lava', icon: '🌋', price: 5000, desc: '', status: 'active', sortOrder: 3 },
      { id: 'sambal_matah', name: 'Sambal Matah', icon: '🌶', price: 3000, desc: '', status: 'active', sortOrder: 4 },
    ]
  },
  {
    id: 'side_menus',
    name: 'Menu Pendamping / Minuman',
    description: 'Mau sekalian minum?',
    type: 'single',
    required: false,
    status: 'active',
    sortOrder: 3,
    options: [
      { id: 'iced_tea', name: 'Es Teh Manis', icon: '🧋', price: 5000, desc: '', status: 'active', sortOrder: 1 },
      { id: 'orange_ice', name: 'Es Jeruk', icon: '🍊', price: 6000, desc: '', status: 'active', sortOrder: 2 },
      { id: 'lemon_tea', name: 'Lemon Tea', icon: '🍋', price: 6000, desc: '', status: 'active', sortOrder: 3 },
      { id: 'milo', name: 'Milo', icon: '🥛', price: 8000, desc: '', status: 'active', sortOrder: 4 },
    ]
  }
];

// Customer: get active variations
app.get(
  '/api/variations',
  auth,
  async (req, res) => {
    try {
      const activeGroups = variationGroupsStore
        .filter(g => g.status === 'active')
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(g => ({
          ...g,
          options: (g.options || [])
            .filter(o => o.status === 'active')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        }));
      res.json(activeGroups);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cashier: get all variations
app.get(
  '/api/cashier/variations',
  auth,
  allow('cashier'),
  async (req, res) => {
    try {
      res.json(variationGroupsStore);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cashier: create or update group
app.post(
  '/api/cashier/variations/group',
  auth,
  allow('cashier'),
  async (req, res) => {
    try {
      const { id, name, description, type, required, status, sortOrder, options } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama kelompok variasi wajib diisi.' });
      }

      const groupId = id || toSlug(name) || ('group_' + Date.now());
      const existingIdx = variationGroupsStore.findIndex(g => g.id === groupId);

      const groupData = {
        id: groupId,
        name: name.trim(),
        description: description ? description.trim() : '',
        type: type === 'multiple' ? 'multiple' : 'single',
        required: Boolean(required),
        status: status === 'inactive' ? 'inactive' : 'active',
        sortOrder: Number(sortOrder) || (existingIdx >= 0 ? variationGroupsStore[existingIdx].sortOrder : variationGroupsStore.length + 1),
        options: Array.isArray(options) ? options : (existingIdx >= 0 ? variationGroupsStore[existingIdx].options : [])
      };

      if (existingIdx >= 0) {
        variationGroupsStore[existingIdx] = groupData;
      } else {
        variationGroupsStore.push(groupData);
      }

      await audit(req, existingIdx >= 0 ? 'UPDATE_VARIATION_GROUP' : 'CREATE_VARIATION_GROUP', 'variations', groupId, { name });
      res.status(existingIdx >= 0 ? 200 : 201).json(groupData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cashier: delete group
app.delete(
  '/api/cashier/variations/group/:id',
  auth,
  allow('cashier'),
  async (req, res) => {
    try {
      const { id } = req.params;
      variationGroupsStore = variationGroupsStore.filter(g => g.id !== id);
      await audit(req, 'DELETE_VARIATION_GROUP', 'variations', id);
      res.json({ success: true, message: 'Kelompok variasi berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cashier: create or update option
app.post(
  '/api/cashier/variations/group/:groupId/option',
  auth,
  allow('cashier'),
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { id, name, icon, price, desc, status, sortOrder } = req.body;

      const group = variationGroupsStore.find(g => g.id === groupId);
      if (!group) {
        return res.status(404).json({ error: 'Kelompok variasi tidak ditemukan.' });
      }

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama opsi variasi wajib diisi.' });
      }

      const optId = id || toSlug(name) || ('opt_' + Date.now());
      if (!Array.isArray(group.options)) {
        group.options = [];
      }

      const existingIdx = group.options.findIndex(o => o.id === optId);
      const optData = {
        id: optId,
        name: name.trim(),
        icon: icon || '✨',
        price: Number(price) >= 0 ? Number(price) : 0,
        desc: desc ? desc.trim() : '',
        status: status === 'inactive' ? 'inactive' : 'active',
        sortOrder: Number(sortOrder) || (existingIdx >= 0 ? group.options[existingIdx].sortOrder : group.options.length + 1)
      };

      if (existingIdx >= 0) {
        group.options[existingIdx] = optData;
      } else {
        group.options.push(optData);
      }

      await audit(req, existingIdx >= 0 ? 'UPDATE_VARIATION_OPTION' : 'CREATE_VARIATION_OPTION', 'variations', optId, { groupId, name });
      res.status(existingIdx >= 0 ? 200 : 201).json(optData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Cashier: delete option
app.delete(
  '/api/cashier/variations/group/:groupId/option/:optId',
  auth,
  allow('cashier'),
  async (req, res) => {
    try {
      const { groupId, optId } = req.params;
      const group = variationGroupsStore.find(g => g.id === groupId);
      if (!group) {
        return res.status(404).json({ error: 'Kelompok variasi tidak ditemukan.' });
      }

      group.options = (group.options || []).filter(o => o.id !== optId);
      await audit(req, 'DELETE_VARIATION_OPTION', 'variations', optId, { groupId });
      res.json({ success: true, message: 'Opsi variasi berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);



/* =========================================================
   CUSTOMER MENU
========================================================= */

app.get(
  '/api/menu',
  auth,

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .eq(
            'is_active',
            true
          )
          .order(
            'name'
          );

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER MENU
========================================================= */

app.get(
  '/api/cashier/menu',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .order(
            'id',
            {
              ascending:
                false
            }
          );

      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }

      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   SAVE MENU
========================================================= */

async function saveMenu(
  req,
  res,
  id = null
) {

  const parsed =
    menuSchema.safeParse(
      req.body
    );

  if (!parsed.success) {
    return res
      .status(400)
      .json({
        error:
          'Data menu tidak valid.',

        details:
          parsed.error.flatten()
      });
  }

  const {
    categoryId,
    name,
    description,
    price,
    isActive
  } =
    parsed.data;


  const {
    data: category
  } =
    await req.db
      .from(
        'categories'
      )
      .select(
        'id'
      )
      .eq(
        'id',
        categoryId
      )
      .maybeSingle();


  if (!category) {
    return res
      .status(400)
      .json({
        error:
          'Kategori tidak ditemukan.'
      });
  }


  let image_url =
    null;


  if (id) {
    const {
      data: oldMenu
    } =
      await req.db
        .from(
          'menu'
        )
        .select(
          'image_url'
        )
        .eq(
          'id',
          id
        )
        .maybeSingle();

    image_url =
      oldMenu?.image_url ||
      null;
  }


  if (req.file) {

    const ext =
      (
        req.file
          .originalname
          .split('.')
          .pop() ||
        'jpg'
      )
      .toLowerCase();


    const allowedExt = [
      'jpg',
      'jpeg',
      'png',
      'webp'
    ];


    const safeExt =
      allowedExt.includes(
        ext
      )
        ? ext
        : 'jpg';


    const path =
      `menu/menu-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${safeExt}`;


    const {
      error: uploadError
    } =
      await req.db.storage
        .from(
          'menu-images'
        )
        .upload(
          path,
          req.file.buffer,
          {
            contentType:
              req.file.mimetype,

            upsert:
              false
          }
        );


    if (uploadError) {
      return res
        .status(400)
        .json({
          error:
            'Gagal mengupload gambar.',

          detail:
            uploadError.message
        });
    }


    image_url =
      req.db.storage
        .from(
          'menu-images'
        )
        .getPublicUrl(
          path
        )
        .data
        .publicUrl;
  }


  const payload = {
    category_id:
      categoryId,

    name:
      name.trim(),

    description:
      description ||
      null,

    price,

    image_url,

    is_active:
      isActive,

    updated_at:
      new Date()
        .toISOString()
  };


  const query =
    id
      ? req.db
          .from(
            'menu'
          )
          .update(
            payload
          )
          .eq(
            'id',
            id
          )
      : req.db
          .from(
            'menu'
          )
          .insert(
            payload
          );


  const {
    data,
    error
  } =
    await query
      .select(`
        id,
        category_id,
        name,
        description,
        price,
        image_url,
        is_active,
        categories(
          id,
          name
        )
      `)
      .single();


  if (error) {
    return res
      .status(400)
      .json({
        error:
          error.message
      });
  }


  await audit(
    req,
    id
      ? 'UPDATE_MENU'
      : 'CREATE_MENU',
    'menu',
    data.id,
    {
      name:
        data.name,

      price:
        data.price
    }
  );


  return res
    .status(
      id
        ? 200
        : 201
    )
    .json(
      data
    );
}


/* =========================================================
   CREATE MENU
========================================================= */

app.post(
  '/api/cashier/menu',
  auth,
  allow('cashier'),
  upload.single('image'),

  (
    req,
    res,
    next
  ) =>
    saveMenu(
      req,
      res
    ).catch(
      next
    )
);


/* =========================================================
   UPDATE MENU
========================================================= */

app.put(
  '/api/cashier/menu/:id',
  auth,
  allow('cashier'),
  upload.single('image'),

  (
    req,
    res,
    next
  ) =>
    saveMenu(
      req,
      res,
      Number(
        req.params.id
      )
    ).catch(
      next
    )
);


/* =========================================================
   TOGGLE MENU STATUS
========================================================= */

app.patch(
  '/api/cashier/menu/:id/status',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            error:
              'ID menu tidak valid.'
          });
      }


      const isActive =
        Boolean(
          req.body?.isActive
        );


      const {
        data,
        error
      } =
        await req.db
          .from(
            'menu'
          )
          .update({
            is_active:
              isActive,

            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            id
          )
          .select(`
            id,
            category_id,
            name,
            description,
            price,
            image_url,
            is_active,
            categories(
              id,
              name
            )
          `)
          .single();


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      await audit(
        req,
        'TOGGLE_MENU',
        'menu',
        data.id,
        {
          is_active:
            data.is_active
        }
      );


      res.json(
        data
      );

    } catch (error) {
      next(error);
    }

  }
);

/* =========================================================
   DELETE MENU
========================================================= */

app.delete(
  '/api/cashier/menu/:id',
  auth,
  allow('cashier'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'ID menu tidak valid.' });
      }

      // Check if menu is referenced in order_items
      const { data: orderItemRef } = await req.db
        .from('order_items')
        .select('id')
        .eq('menu_id', id)
        .limit(1);

      if (orderItemRef && orderItemRef.length > 0) {
        // If already in order history, safely archive/deactivate rather than hard delete to preserve history
        await req.db
          .from('menu')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        await audit(req, 'ARCHIVE_MENU', 'menu', id, { reason: 'has_order_history' });

        return res.json({
          success: true,
          message: 'Menu memiliki riwayat pesanan sehingga dinonaktifkan dari katalog.'
        });
      }

      const { error: delErr } = await req.db
        .from('menu')
        .delete()
        .eq('id', id);

      if (delErr) {
        // Fallback: if delete violates foreign key, deactivate
        await req.db
          .from('menu')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', id);

        return res.json({
          success: true,
          message: 'Menu memiliki riwayat pesanan sehingga dinonaktifkan dari katalog.'
        });
      }

      await audit(req, 'DELETE_MENU', 'menu', id);
      res.json({ success: true, message: 'Menu berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   MENU MAP
   + CATEGORY
========================================================= */

async function menuMap(
  dbClient,
  items
) {

  const ids =
    [
      ...new Set(
        items.map(
          (x) =>
            x.menuId
        )
      )
    ];


  const {
    data,
    error
  } =
    await dbClient
      .from(
        'menu'
      )
      .select(`
        id,
        name,
        price,
        is_active,
        categories(
          id,
          name
        )
      `)
      .in(
        'id',
        ids
      );


  if (error) {
    throw new Error(
      error.message
    );
  }


  const map =
    new Map(
      (
        data || []
      ).map(
        (m) => [
          m.id,
          m
        ]
      )
    );


  for (
    const item
    of items
  ) {

    const menu =
      map.get(
        item.menuId
      );


    if (!menu) {
      throw new Error(
        `Menu ID ${item.menuId} tidak ditemukan.`
      );
    }


    if (
      !menu.is_active
    ) {
      throw new Error(
        `Menu "${menu.name}" sedang tidak tersedia.`
      );
    }
  }


  return map;
}


/* =========================================================
   CUSTOMER CREATE ORDER
========================================================= */

app.post(
  '/api/orders',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {
    try {

      const parsed =
        orderSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data checkout tidak valid.',

            details:
              parsed.error.flatten()
          });
      }

      const {
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        orderNotes,
        paymentMethod,
        items
      } = parsed.data;

      /*
       * CUSTOMER CHECKOUT
       *
       * Semua transaksi yang dibuat
       * dari halaman customer otomatis
       * masuk sebagai WEBSITE.
       */
      const finalSalesChannel =
        'website';

      /*
       * Ambil data menu dari database.
       * Harga TIDAK diambil dari frontend.
       */
      const map =
        await menuMap(
          req.db,
          items
        );

      /*
       * Buat order_items terlebih dahulu
       * di memory dan hitung total langsung.
       */
      const orderItems =
        items.map(
          (item) => {

            const menu =
              map.get(
                item.menuId
              );

            const isAyamGeprek =
              menu
                ?.categories
                ?.name ===
              'Ayam Geprek';

            return {
              menu_id:
                item.menuId,

              quantity:
                Number(
                  item.quantity
                ),

              unit_price:
                Number(
                  menu.price
                ),

              spice_level:
                isAyamGeprek
                  ? (
                      item.spiceLevel ||
                      'sedang'
                    )
                  : 'sedang',

              notes:
                item.notes ||
                null
            };
          }
        );

      /*
       * HITUNG TOTAL SEBELUM INSERT ORDER
       *
       * contoh:
       * 22000 + 7000 + 5000
       * = 34000
       */
      const total =
        orderItems.reduce(
          (sum, item) =>
            sum +
            (
              Number(
                item.unit_price || 0
              ) *
              Number(
                item.quantity || 0
              )
            ),
          0
        );

      /*
       * Pastikan total valid.
       */
      if (
        !Number.isFinite(total) ||
        total <= 0
      ) {
        return res
          .status(400)
          .json({
            error:
              'Total pesanan tidak valid.'
          });
      }

      /*
       * INSERT ORDER
       *
       * Total langsung diisi
       * dengan hasil perhitungan.
       *
       * Customer:
       * status = pending
       * payment_status = pending
       * sales_channel = website
       */
      const {
        data: order,
        error: orderError
      } =
        await req.db
          .from('orders')
          .insert({
            customer_id:
              req.user.id,

            customer_name:
              customerName ||
              req.profile.full_name,

            customer_phone:
              customerPhone ||
              req.profile.phone ||
              null,

            address:
              address ||
              req.profile.address ||
              null,

            latitude:
              latitude ??
              req.profile.latitude ??
              null,

            longitude:
              longitude ??
              req.profile.longitude ??
              null,

            order_notes:
              orderNotes ||
              null,

            sales_channel:
              finalSalesChannel,

            payment_method:
              paymentMethod,

            payment_status:
              'pending',

            status:
              'pending',

            total:
              total
          })
          .select(`
            id,
            order_code,
            customer_id,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            sales_channel,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at
          `)
          .single();

      if (orderError) {
        return res
          .status(400)
          .json({
            error:
              orderError.message
          });
      }

      /*
       * Tambahkan order_id setelah
       * order utama berhasil dibuat.
       */
      const orderItemsWithOrderId =
        orderItems.map(
          (item) => ({
            order_id:
              order.id,

            menu_id:
              item.menu_id,

            quantity:
              item.quantity,

            unit_price:
              item.unit_price,

            spice_level:
              item.spice_level,

            notes:
              item.notes
          })
        );

      /*
       * INSERT ORDER ITEMS
       */
      const {
        error: itemError
      } =
        await req.db
          .from('order_items')
          .insert(
            orderItemsWithOrderId
          );

      if (itemError) {

        /*
         * Bersihkan order jika
         * order_items gagal dibuat.
         */
        await req.db
          .from('orders')
          .delete()
          .eq(
            'id',
            order.id
          );

        return res
          .status(400)
          .json({
            error:
              itemError.message
          });
      }

      /*
       * AUDIT LOG
       */
      await audit(
        req,
        'CREATE_ORDER',
        'orders',
        order.id,
        {
          total:
            total,

          sales_channel:
            finalSalesChannel,

          source:
            'customer'
        }
      );

      /*
       * RESPONSE
       */
      return res
        .status(201)
        .json({
          ...order,

          total:
            total,

          sales_channel:
            finalSalesChannel,

          status:
            'pending',

          payment_status:
            'pending'
        });

    } catch (error) {
      next(error);
    }
  }
);


/* =========================================================
   CUSTOMER ORDER HISTORY
========================================================= */

app.get(
  '/api/my/orders',
  auth,
  allow('customer'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .eq(
            'customer_id',
            req.user.id
          )
          .order(
            'ordered_at',
            {
              ascending:
                false
            }
          )
          .limit(
            100
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      res.json(
        data || []
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER MANUAL ORDER
========================================================= */

app.post(
  '/api/cashier/orders',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const body = {
        ...req.body,

        paymentStatus:
          'paid'
      };


      const parsed =
        manualOrderSchema.safeParse(
          body
        );


      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Data transaksi manual tidak valid.',

            details:
              parsed.error.flatten()
          });
      }


      const {
        customerId,
        customerName,
        customerPhone,
        address,
        latitude,
        longitude,
        orderNotes,
        salesChannel,
        paymentMethod,
        items
      } =
        parsed.data;


      const map =
        await menuMap(
          req.db,
          items
        );


      const {
        data: order,
        error: orderError
      } =
        await req.db
          .from(
            'orders'
          )
          .insert({
            customer_id:
              customerId ||
              null,

            cashier_id:
              req.user.id,

            customer_name:
              customerName ||
              'Pelanggan Offline',

            customer_phone:
              customerPhone ||
              null,

            address:
              address ||
              null,

            latitude:
              latitude ??
              null,

            longitude:
              longitude ??
              null,

            order_notes:
              orderNotes ||
              null,

            sales_channel:
              salesChannel ||
              'offline',

            payment_method:
              paymentMethod,

            /*
             * Manual:
             * transaksi langsung selesai
             * dan pembayaran langsung lunas.
             */
            payment_status:
              'paid',

            status:
              'completed',

            total:
              0
          })
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at
          `)
          .single();


      if (orderError) {
        return res
          .status(400)
          .json({
            error:
              orderError.message
          });
      }


      const orderItems =
        items.map(
          (item) => {

            const menu =
              map.get(
                item.menuId
              );

            const isAyamGeprek =
              menu
                ?.categories
                ?.name ===
              'Ayam Geprek';


            return {
              order_id:
                order.id,

              menu_id:
                item.menuId,

              quantity:
                item.quantity,

              unit_price:
                menu.price,

              spice_level:
                isAyamGeprek
                  ? (
                      item.spiceLevel ||
                      'sedang'
                    )
                  : 'sedang',

              notes:
                null
            };
          }
        );


      const {
        error: itemError
      } =
        await req.db
          .from(
            'order_items'
          )
          .insert(
            orderItems
          );


      if (itemError) {
        return res
          .status(400)
          .json({
            error:
              itemError.message
          });
      }


      const {
        data: total,
        error: totalError
      } =
        await req.db.rpc(
          'recalc_order_total',
          {
            p_order_id:
              order.id
          }
        );


      if (totalError) {
        return res
          .status(400)
          .json({
            error:
              totalError.message
          });
      }


      /*
       * Pastikan transaksi manual
       * tetap lunas setelah RPC.
       */
      await req.db
        .from(
          'orders'
        )
        .update({
          status:
            'completed',

          payment_status:
            'paid',

          cashier_id:
            req.user.id,

          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          'id',
          order.id
        );


      await audit(
        req,
        'CREATE_MANUAL_ORDER',
        'orders',
        order.id,
        {
          total,
          source:
            'cashier'
        }
      );


      res
        .status(201)
        .json({
          ...order,

          total,

          status:
            'completed',

          payment_status:
            'paid'
        });

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER ORDERS
========================================================= */

app.get(
  '/api/cashier/orders',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            order_code,
            customer_id,
            customer_name,
            customer_phone,
            address,
            latitude,
            longitude,
            order_notes,
            sales_channel,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .order(
            'ordered_at',
            {
              ascending:
                false
            }
          )
          .limit(
            200
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      /*
       * Sinkronisasi tampilan pembayaran
       * dengan status pesanan.
       *
       * completed = paid
       * lainnya   = pending
       */
      const normalized =
        (data || [])
          .map(
            (order) => ({
              ...order,

              payment_status:
                order.status ===
                'completed'
                  ? 'paid'
                  : 'pending'
            })
          );


      res.json(
        normalized
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

app.patch(
  '/api/cashier/orders/:id/status',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const parsed =
        statusSchema.safeParse(
          req.body
        );


      if (!parsed.success) {
        return res
          .status(400)
          .json({
            error:
              'Status pesanan tidak valid.'
          });
      }


      const id =
        Number(
          req.params.id
        );


      if (
        !Number.isInteger(id)
      ) {
        return res
          .status(400)
          .json({
            error:
              'ID pesanan tidak valid.'
          });
      }


      const newStatus =
        parsed.data.status;


      /*
       * RULE:
       *
       * completed -> paid
       * selain completed -> pending
       */
      const paymentStatus =
        newStatus ===
        'completed'
          ? 'paid'
          : 'pending';


      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .update({

            status:
              newStatus,

            payment_status:
              paymentStatus,

            cashier_id:
              req.user.id,

            updated_at:
              new Date()
                .toISOString()
          })
          .eq(
            'id',
            id
          )
          .select(`
            id,
            order_code,
            customer_name,
            customer_phone,
            address,
            order_notes,
            total,
            payment_method,
            payment_status,
            status,
            ordered_at,
            updated_at,

            order_items(
              id,
              quantity,
              unit_price,
              spice_level,
              notes,

              menu(
                id,
                name,
                image_url,

                categories(
                  id,
                  name
                )
              )
            )
          `)
          .single();


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      await audit(
        req,
        'UPDATE_ORDER_STATUS',
        'orders',
        data.id,
        {
          status:
            data.status,

          payment_status:
            data.payment_status
        }
      );


      res.json(
        data
      );

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   CASHIER DASHBOARD
========================================================= */

app.get(
  '/api/cashier/dashboard',
  auth,
  allow('cashier'),

  async (
    req,
    res,
    next
  ) => {

    try {

      const start =
        new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );


      const {
        data,
        error
      } =
        await req.db
          .from(
            'orders'
          )
          .select(`
            id,
            total,
            status,
            payment_status,
            ordered_at
          `)
          .gte(
            'ordered_at',
            start.toISOString()
          );


      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message
          });
      }


      const orders =
        data || [];


      /*
       * Untuk dashboard:
       * payment_status dihitung berdasarkan
       * status pesanan supaya konsisten.
       */
      const normalized =
        orders.map(
          (order) => ({
            ...order,

            payment_status:
              order.status ===
              'completed'
                ? 'paid'
                : 'pending'
          })
        );


      res.json({

        totalOrders:
          normalized.length,


        pendingOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'pending'
          ).length,


        preparingOrders:
          normalized.filter(
            (order) =>
              [
                'confirmed',
                'preparing'
              ].includes(
                order.status
              )
          ).length,


        readyOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'ready'
          ).length,


        completedOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'completed'
          ).length,


        paidOrders:
          normalized.filter(
            (order) =>
              order.status ===
              'completed'
          ).length,


        omzetToday:
          normalized
            .filter(
              (order) =>
                order.status !==
                'cancelled'
            )
            .reduce(
              (
                sum,
                order
              ) =>
                sum +
                Number(
                  order.total ||
                  0
                ),
              0
            )
      });

    } catch (error) {
      next(error);
    }

  }
);


/* =========================================================
   GLOBAL ERROR
========================================================= */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      'GLOBAL ERROR:',
      err
    );


    if (
      res.headersSent
    ) {
      return next(
        err
      );
    }


    res
      .status(500)
      .json({
        error:
          err.message ||
          'Internal server error.'
      });

  }
);


/* =========================================================
   SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `Project 1 backend http://localhost:${PORT}`
    );

  }
);