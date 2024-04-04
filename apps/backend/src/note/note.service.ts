import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, Note, User, Tag } from '@prisma/client'
import { PrismaService } from 'nestjs-prisma'
import { TagService } from '../tag/tag.service'
import { CreateNoteDto } from './dto/create-note.dto'

@Injectable()
export class NoteService {
  constructor(private prisma: PrismaService, private tagService: TagService) {}

  async note(
    noteWhereUniqueInput: Prisma.NoteWhereUniqueInput
  ): Promise<Note | null> {
    return await this.prisma.note.findUnique({
      where: noteWhereUniqueInput,
      include: {
        tags: true,
      },
    })
  }

  async notes(params: {
    skip?: number
    take?: number
    cursor?: Prisma.NoteWhereUniqueInput
    where?: Prisma.NoteWhereInput
    orderBy?: Prisma.NoteOrderByWithRelationInput
  }): Promise<Note[]> {
    const { skip, take, cursor, where, orderBy } = params
    return await this.prisma.note.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        tags: true,
      },
    })
  }

  async createNote(
    userId: User['id'],
    data: Omit<Prisma.NoteCreateInput, 'User'>
  ): Promise<Note> {
    return await this.prisma.note.create({
      data: {
        ...data,
        User: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        tags: true,
      },
    })
  }

  async updateNote(params: {
    where: Prisma.NoteWhereUniqueInput
    data: Prisma.NoteUpdateInput
  }): Promise<Note> {
    const { where, data } = params
    try {
      return await this.prisma.note.update({
        data: {
          ...data,
          dateUpdated: new Date(),
        },
        include: {
          tags: true,
        },
        where,
      })
    } catch (e) {
      throw new NotFoundException('Note not found')
    }
  }

  async deleteNote(where: Prisma.NoteWhereUniqueInput): Promise<Note> {
    return await this.prisma.note.delete({
      where,
    })
  }

  async createNoteFromDTO(
    userId: User['id'],
    data: CreateNoteDto
  ): Promise<Note> {
    let note = await this.createNote(userId, {
      ...data,
      tags: {},
    })

    if (data.tags) {
      note = await this.addNoteTags(note.id, data.tags)
    }

    return note
  }

  async addNoteTag(noteId: Note['id'], tagId: Tag['id']): Promise<Note> {
    return await this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        tags: {
          connect: {
            id: tagId,
          },
        },
      },
      include: {
        tags: true,
      },
    })
  }

  async removeNoteTag(noteId: Note['id'], tagId: Tag['id']): Promise<Note> {
    return await this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        tags: {
          disconnect: {
            id: tagId,
          },
        },
      },
      include: {
        tags: true,
      },
    })
  }

  async addNoteTags(
    noteId: Note['id'],
    tagsIds: Array<Tag['id']>
  ): Promise<Note> {
    return await this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        tags: {
          connect: tagsIds.map((id) => ({ id })),
        },
      },
      include: {
        tags: true,
      },
    })
  }

  async removeNoteTags(
    noteId: Note['id'],
    tagsIds: Array<Tag['id']>
  ): Promise<Note> {
    return await this.prisma.note.update({
      where: {
        id: noteId,
      },
      data: {
        tags: {
          disconnect: tagsIds.map((id) => ({ id })),
        },
      },
      include: {
        tags: true,
      },
    })
  }
}
