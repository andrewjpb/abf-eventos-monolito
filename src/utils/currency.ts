import { MyBig } from "@/lib/big"


export const toCent = (amount: number) => MyBig(amount).mul(100).round().toNumber()

export const fromCent = (amount: number) => MyBig(amount).div(100).toNumber()

const toCurrerncyFromCent = (amount: number) => {
  const formattedAmount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(fromCent(amount))
  return formattedAmount
}

export { toCurrerncyFromCent }