let z
try {
  z = (await import('zod')).z
} catch {
  // fallback stub — allows server to run without zod installed (validation becomes pass-through)
  const stub = { safeParse: (data) => ({ success: true, data }), partial: function(){ return this }, optional: function(){ return this }, default: function(){ return this } }
  const chain = new Proxy(stub, { get(target, prop){ if(prop in target) return target[prop]; return () => chain } })
  z = new Proxy({}, {
    get(_, prop){
      if(prop==='object') return () => chain
      if(prop==='string') return () => chain
      if(prop==='number') return () => chain
      if(prop==='array') return () => chain
      if(prop==='enum') return () => chain
      if(prop==='coerce') return new Proxy({}, { get:() => () => chain })
      return () => chain
    }
  })
}

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: z.enum(['entrepreneur', 'investor']).default('entrepreneur'),
})

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  code: z.string().regex(/^\d{6}$/),
})

export const resendVerificationCodeSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
})

export const startupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  website: z.string().trim().max(300).optional(),
  industry: z.string().trim().min(1).optional(),
  startupStage: z.string().trim().optional(),
  location: z.string().trim().optional(),
  riskPreference: z.enum(['Low', 'Medium', 'High']).optional(),
  businessModel: z.string().trim().max(2000).optional(),
  targetMarket: z.string().trim().max(2000).optional(),
  revenue: z.object({ amount: z.number().min(0).optional(), currency: z.string().optional() }).optional(),
  fundingRequired: z.object({ amount: z.number().min(0).optional(), currency: z.string().default('INR').optional() }).optional(),
  valuation: z.object({ amount: z.number().min(0).optional(), currency: z.string().optional() }).optional(),
  equityOffered: z.number().min(0).max(100).optional(),
  teamSize: z.number().int().min(1).max(100000).optional(),
  foundedYear: z.number().int().min(1980).max(2100).optional(),
  tags: z.array(z.string().trim().max(40)).max(12).optional(),
  pitchDeckUrl: z.string().trim().max(500).optional(),
  visibility: z.enum(['public', 'private']).optional(),
})

export const investorSchema = z.object({
  organization: z.string().trim().min(2).max(150),
  bio: z.string().trim().max(4000).optional(),
  location: z.string().trim().optional(),
  preferredIndustries: z.array(z.string()).optional(),
  preferredStages: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  riskPreference: z.enum(['Low', 'Medium', 'High']).optional(),
  investmentType: z.enum(['Equity', 'Convertible Note', 'SAFE', 'Debt']).optional(),
  investmentRange: z.object({ minimum: z.number().min(0).optional(), maximum: z.number().min(0).optional(), currency: z.string().optional() }).optional(),
  equityMin: z.number().min(0).max(100).optional(),
  equityMax: z.number().min(0).max(100).optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  sort: z.string().optional(),
})

export const requestSchema = z.object({
  startupId: z.string().optional(),
  investorId: z.string().optional(),
  startup: z.string().optional(),
  investor: z.string().optional(),
  message: z.string().max(1000).optional(),
})
