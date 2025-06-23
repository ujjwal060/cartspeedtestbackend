// utils/getNextCertificateNumber.js
import CounterModel from '../models/CounterModel.js';

const getNextCertificateNumber = async () => {
  const counter = await CounterModel.findOneAndUpdate(
    { name: 'certificate' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.value).padStart(3, '0'); // 001, 002, ...
  return `CERT-${padded}`;
};

export {getNextCertificateNumber}
