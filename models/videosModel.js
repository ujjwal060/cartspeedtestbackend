import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String },
  // durationTime: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

const sectionSchema = new mongoose.Schema({
  sectionNumber: { type: Number, required: true },
  title: { type: String, required: true },
  durationTime: { type: String, default: '0m' },
  videos: {
    type: [videoSchema],
  },
});

const locationVideoSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    sections: {
      type: [sectionSchema],
    },
  },
  { timestamps: true }
);

locationVideoSchema.methods.addOrUpdateVideo = async function (sectionNumber, videoData, sectionTitle) {
  let section = this.sections.find(sec => sec.sectionNumber === sectionNumber);

  if (!section) {
    section = {
      sectionNumber,
      title: sectionTitle,
      videos: [videoData],
    };
    this.sections.push(section);
  } else {
    const activeVideos = section.videos.filter(video => video.isActive).length;

    if (activeVideos < 5) {
      section.videos.push({
        ...videoData,
        isActive: activeVideos < 5,
      });
    } else {
      section.videos.push({
        ...videoData,
        isActive: false,
      });
    }
  }

  await this.calculateSectionDuration(sectionNumber);

  return this.save();
};

locationVideoSchema.methods.calculateSectionDuration = function (sectionNumber) {
  const section = this.sections.find(sec => sec.sectionNumber === sectionNumber);
  
  if (!section) return;

  const totalDuration = section.videos.reduce((total, video) => {
    return total + convertToMinutes(video.durationTime);
  }, 0);

  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  section.durationTime = `${hours}h ${minutes}m`;
  return this.save();
};

const convertToMinutes = (timeStr) => {
  const timeParts = timeStr.split(' ');
  let totalMinutes = 0;

  timeParts.forEach((part) => {
    if (part.includes('h')) {
      totalMinutes += parseInt(part) * 60;
    } else if (part.includes('m')) {
      totalMinutes += parseInt(part);
    }
  });

  return totalMinutes;
};

const LocationVideo = mongoose.model('LocationVideo', locationVideoSchema);
export default LocationVideo;
