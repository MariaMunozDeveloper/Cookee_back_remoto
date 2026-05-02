'use strict';

const Comment = require('../models/comment.model');
const Publication = require('../models/publication.model');
const commentController = {};

commentController.save = async (req, res) => {
    try {
        const { text } = req.body;
        const publicationId = req.params.id;

        if (!text || !text.trim()) {
            return res.status(400).json({ status: false, message: 'El comentario no puede estar vacío' });
        }

        const comment = new Comment({
            text,
            user: req.user.sub,
            publication: publicationId
        });

        const saved = await comment.save();
        await saved.populate('user', '-password');

        return res.status(201).json({ status: true, comment: saved });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

commentController.reply = async (req, res) => {
    try {
        const { text } = req.body;
        const parentCommentId = req.params.id;

        if (!text || !text.trim()) {
            return res.status(400).json({ status: false, message: 'La respuesta no puede estar vacía' });
        }

        const parent = await Comment.findById(parentCommentId);
        if (!parent) {
            return res.status(404).json({ status: false, message: 'Comentario no encontrado' });
        }

        const reply = new Comment({
            text,
            user: req.user.sub,
            publication: parent.publication,
            parentComment: parentCommentId
        });

        const saved = await reply.save();
        await saved.populate('user', '-password');

        return res.status(201).json({ status: true, comment: saved });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

commentController.getByPublication = async (req, res) => {
    try {
        const publicationId = req.params.id;

        const allComments = await Comment.find({ publication: publicationId })
            .populate('user', '-password')
            .sort({ createdAt: 1 });

        const mainComments = allComments
            .filter(c => !c.parentComment)
            .map(c => ({
                ...c.toObject(),
                replies: allComments
                    .filter(r => r.parentComment?.toString() === c._id.toString())
                    .map(r => r.toObject())
            }));

        return res.status(200).json({ status: true, comments: mainComments });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

commentController.remove = async (req, res) => {
    try {
        const commentId = req.params.id;
        const userId = req.user.sub;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ status: false, message: 'Comentario no encontrado' });
        }

        const publication = await Publication.findById(comment.publication);
        const isAuthorOfComment = comment.user.toString() === userId;
        const isAuthorOfPublication = publication?.user.toString() === userId;

        if (!isAuthorOfComment && !isAuthorOfPublication) {
            return res.status(403).json({ status: false, message: 'Sin permiso para eliminar este comentario' });
        }

        await Comment.deleteMany({ parentComment: commentId });
        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({ status: true, message: 'Comentario eliminado' });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

module.exports = commentController;