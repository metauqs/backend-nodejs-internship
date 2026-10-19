function serialize(doc) {
    if (!doc)
        return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject({
        virtuals: true
    }) : {
        ...doc
    };
    const id = String(obj._id || obj.id || '');
    return {
        ...obj,
        id,
        _id: id
    };
}
module.exports = {
    serialize
};
