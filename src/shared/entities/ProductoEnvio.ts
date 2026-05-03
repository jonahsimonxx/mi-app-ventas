import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Envio } from './Envio';
import { Producto } from './Producto';

@Entity('producto_envio')
export class ProductoEnvio {
  @PrimaryColumn({ type: 'numeric' })
  id!: number;

  @ManyToOne(() => Envio)
  @JoinColumn({ name: 'envio_id' })
  envio!: Envio;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id', referencedColumnName: 'id_prod' })
  producto!: Producto;
}