const mongoose = require('mongoose');
const { getCollectionForModel } = require('./inMemoryStore');

let isConnected = false;

function patchModelWithInMemoryFallback(model) {
  const modelName = model.modelName;
  const inMem = getCollectionForModel(modelName);

  const originalFind = model.find.bind(model);
  const originalFindOne = model.findOne.bind(model);
  const originalFindById = model.findById.bind(model);
  const originalCreate = model.create.bind(model);
  const originalUpdateOne = model.updateOne.bind(model);
  const originalFindOneAndUpdate = model.findOneAndUpdate.bind(model);
  const originalDeleteOne = model.deleteOne.bind(model);
  const originalDeleteMany = model.deleteMany.bind(model);
  const originalAggregate = model.aggregate ? model.aggregate.bind(model) : null;

  model.find = function (filter, ...rest) {
    if (mongoose.connection.readyState === 1) return originalFind(filter, ...rest);
    return inMem.find(filter);
  };

  model.findOne = function (filter, ...rest) {
    if (mongoose.connection.readyState === 1) return originalFindOne(filter, ...rest);
    return inMem.findOne(filter);
  };

  model.findById = function (id, ...rest) {
    if (mongoose.connection.readyState === 1) return originalFindById(id, ...rest);
    return inMem.findById(id);
  };

  model.create = function (doc, ...rest) {
    if (mongoose.connection.readyState === 1) return originalCreate(doc, ...rest);
    return inMem.create(doc);
  };

  model.updateOne = function (filter, update, options, ...rest) {
    if (mongoose.connection.readyState === 1) return originalUpdateOne(filter, update, options, ...rest);
    return inMem.updateOne(filter, update, options);
  };

  model.findOneAndUpdate = function (filter, update, options, ...rest) {
    if (mongoose.connection.readyState === 1) return originalFindOneAndUpdate(filter, update, options, ...rest);
    return inMem.findOneAndUpdate(filter, update, options);
  };

  model.deleteOne = function (filter, ...rest) {
    if (mongoose.connection.readyState === 1) return originalDeleteOne(filter, ...rest);
    return inMem.deleteOne(filter);
  };

  model.deleteMany = function (filter, ...rest) {
    if (mongoose.connection.readyState === 1) return originalDeleteMany(filter, ...rest);
    return inMem.deleteMany(filter);
  };

  model.aggregate = function (pipeline, ...rest) {
    if (mongoose.connection.readyState === 1 && originalAggregate) return originalAggregate(pipeline, ...rest);
    return inMem.aggregate(pipeline);
  };
}

function enableInMemoryFallback() {
  const modelNames = mongoose.modelNames();
  for (const name of modelNames) {
    patchModelWithInMemoryFallback(mongoose.model(name));
  }
}

async function connectDB(mongoUri) {
  try {
    mongoose.set('bufferCommands', false); // prevent hanging on disconnected models
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 1500 });
    isConnected = true;
    console.log('[Database] MongoDB connected successfully to:', mongoUri);
  } catch (error) {
    isConnected = false;
    console.log('[Database] Notice: MongoDB offline or unreachable. Activating In-Memory Resilient Store with preloaded demo data.');
    enableInMemoryFallback();
  }
}

module.exports = { connectDB, enableInMemoryFallback, isConnected: () => isConnected };
