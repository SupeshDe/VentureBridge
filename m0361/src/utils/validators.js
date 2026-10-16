export function isValidEmail(email){ return /^\S+@\S+\.\S+$/.test(email) }
export function passwordStrength(pw){
  let score=0
  if(pw.length>=8) score++
  if(/[A-Z]/.test(pw)) score++
  if(/[0-9]/.test(pw)) score++
  if(/[^A-Za-z0-9]/.test(pw)) score++
  return score // 0-4
}
