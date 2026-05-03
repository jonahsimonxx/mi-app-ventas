import { Entity, PrimaryColumn, Column, Check } from 'typeorm';

@Entity('moneda')
@Check(`codigo IN ('USD', 'CUP', 'USDT')`)
@Check(`nombre IN ('Dólar Estadounidense', 'Peso Cubano', 'Tether')`)
export class Moneda {
  @PrimaryColumn({ type: 'varchar', length: 5 })
  codigo!: string;

  @Column({ type: 'varchar', length: 50 })
  nombre!: string;
}