import mongoose, { Schema, Document } from 'mongoose';

export interface IPackage extends Document {
  title: string;
  slug: string;
  state: string;
  category: string;
  season: string;
  difficulty: string;
  duration: string;
  price: string;
  numericPrice: number;
  featured: boolean;
  description: string;
  thumbnail: string;
  heroImage: string;
  waypoints: Array<{
    id: string;
    order: number;
    name: string;
    description: string;
    accommodation: string;
    coordinates: [number, number];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PackageSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    state: { type: String, required: true },
    category: { type: String, required: true },
    season: { type: String, required: true },
    difficulty: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: String, required: true },
    numericPrice: { type: Number, required: true },
    featured: { type: Boolean, default: false },
    description: { type: String, required: true },
    thumbnail: { type: String, required: true },
    heroImage: { type: String, required: true },
    waypoints: [
      {
        id: String,
        order: Number,
        name: String,
        description: String,
        accommodation: String,
        coordinates: [Number],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IPackage>('Package', PackageSchema);
