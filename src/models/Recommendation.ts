import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  property: mongoose.Types.ObjectId;
  message?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
    },
    message: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for frequently queried fields
RecommendationSchema.index({ sender: 1 });
RecommendationSchema.index({ recipient: 1 });
RecommendationSchema.index({ property: 1 });
RecommendationSchema.index({ isRead: 1 });

const Recommendation = mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);

export default Recommendation;