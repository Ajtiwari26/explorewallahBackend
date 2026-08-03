import mongoose, { Schema, Document } from 'mongoose';

export interface IBatchDeparture {
  _id?: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  totalSeats: number;
  bookedSeats: number;
  priceOverride?: number;
  isOpen: boolean;
}

export interface IItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  overnightLocation?: string;
  altitudeFt?: number;
  distanceKm?: number;
}

export interface IPackage extends Document {
  title: string;
  slug: string;
  state?: string;
  category?: string;
  season?: string;
  description: string;
  pricePerPerson: number;
  discountedPrice?: number;
  durationDays: number;
  durationNights: number;
  maxAltitudeFt?: number;
  difficulty: 'Easy' | 'Moderate' | 'Difficult';
  baseLocation: string;
  coverImageUrl?: string;
  homepageThumbnailUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  itinerary: IItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  batches: IBatchDeparture[];
  createdAt: Date;
  updatedAt: Date;
}

const BatchDepartureSchema = new Schema({
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalSeats: { type: Number, required: true, default: 20 },
  bookedSeats: { type: Number, default: 0 },
  priceOverride: { type: Number },
  isOpen: { type: Boolean, default: true },
});

const ItineraryDaySchema = new Schema({
  dayNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  overnightLocation: { type: String },
  altitudeFt: { type: Number },
  distanceKm: { type: Number },
});

const PackageSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    state: { type: String, default: 'Uttarakhand' },
    category: { type: String, default: 'Trekking' },
    season: { type: String, default: 'All Season' },
    description: { type: String, required: true },
    pricePerPerson: { type: Number, required: true },
    discountedPrice: { type: Number },
    durationDays: { type: Number, default: 5 },
    durationNights: { type: Number, default: 4 },
    maxAltitudeFt: { type: Number },
    difficulty: { type: String, enum: ['Easy', 'Moderate', 'Difficult'], default: 'Moderate' },
    baseLocation: { type: String, required: true },
    coverImageUrl: { type: String },
    homepageThumbnailUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    itinerary: [ItineraryDaySchema],
    inclusions: [{ type: String }],
    exclusions: [{ type: String }],
    batches: [BatchDepartureSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IPackage>('Package', PackageSchema);
