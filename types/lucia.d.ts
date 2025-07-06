// types/lucia.d.ts
import { User } from "lucia";

declare module "lucia" {
  interface User {
    roles: any[];
    isAdmin: boolean;  // Agora é um booleano, não uma função
    company?: any;     // Adicionar propriedade company opcional
  }
}