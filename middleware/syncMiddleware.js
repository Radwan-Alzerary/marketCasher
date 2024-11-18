// syncMiddleware.js

module.exports = function (schema) {
    // Add isOnlineSync field to the schema
    schema.add({
      isOnlineSync: {
        type: Boolean,
        default: false,
      },
    });
  
    // Pre-save hook: set isOnlineSync to false if the document is new or modified
    schema.pre('save', function (next) {
      if (this.isNew || this.isModified()) {
        this.isOnlineSync = false;
      }
      next();
    });
  
    // Pre-update hooks: set isOnlineSync to false on update operations
    function setIsOnlineSyncFalse() {
      this.set({ isOnlineSync: false });
    }
  
    schema.pre('findOneAndUpdate', setIsOnlineSyncFalse);
    schema.pre('updateOne', setIsOnlineSyncFalse);
    schema.pre('updateMany', setIsOnlineSyncFalse);
    schema.pre('update', setIsOnlineSyncFalse);
  };
  