import { Router, type Request, type Response } from 'express';
import { inviteService } from './invite.service.ts';
import { requireAdminRole } from '../../../middleware/auth.ts';

export const inviteRouter = Router();

// 1. Public Bootstrap (Landing, Marketplace, Studio Templates, Media Library)
inviteRouter.get('/invite/bootstrap', async (_req: Request, res: Response) => {
  try {
    try {
      const data = await inviteService.getPublicBootstrapData();
      res.status(200).json({ success: true, data });
    } catch (dbErr) {
      console.error('Database query error in GET /invite/bootstrap:', dbErr);
      res.status(500).json({ error: 'Database query failed' });
    }
  } catch (err) {
    console.error('Request error in GET /invite/bootstrap:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Public Invitation & Tokenized Guest Greeting Resolution (Privacy-Safe)
inviteRouter.get('/invite/guest-view/:slug', async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug || 'royal-niavaran-1405');
    const token = typeof req.query.token === 'string' ? req.query.token : undefined;
    try {
      const result = await inviteService.getPublicInvitationBySlug(slug, token);
      if (!result) {
        res.status(404).json({ error: 'Invitation not found' });
        return;
      }
      res.status(200).json({ success: true, data: result });
    } catch (dbErr) {
      console.error('Database query error in GET /invite/guest-view/:slug:', dbErr);
      res.status(500).json({ error: 'Database query failed' });
    }
  } catch (err) {
    console.error('Request error in GET /invite/guest-view/:slug:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Submit Guest RSVP
inviteRouter.post('/invite/rsvp', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    if (!body.respondentName) {
      res.status(400).json({ error: 'Respondent name is required' });
      return;
    }
    try {
      const created = await inviteService.submitGuestRsvp({
        eventId: Number(body.eventId || 1),
        token: body.token ? String(body.token) : undefined,
        respondentName: String(body.respondentName),
        attendanceStatus: body.attendanceStatus || 'attending',
        guestCount: Number(body.guestCount ?? 1),
        dietaryNotes: body.dietaryNotes ? String(body.dietaryNotes) : undefined,
        customAnswersJson: body.customAnswersJson ?? {},
        messageToHosts: body.messageToHosts ? String(body.messageToHosts) : undefined,
      });
      res.status(201).json({ success: true, data: created });
    } catch (dbErr) {
      console.error('Database error in POST /invite/rsvp:', dbErr);
      res.status(500).json({ error: 'Failed to record RSVP response' });
    }
  } catch (err) {
    console.error('Request error in POST /invite/rsvp:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Save Studio Project (Saves user project instance without mutating master template)
inviteRouter.post('/invite/studio/save-project', async (req: Request, res: Response) => {
  try {
    const body = req.body ?? {};
    if (!body.canvasStateJson) {
      res.status(400).json({ error: 'canvasStateJson is required' });
      return;
    }
    try {
      const saved = await inviteService.saveStudioProject(body);
      res.status(200).json({ success: true, data: saved });
    } catch (dbErr) {
      console.error('Database error in POST /invite/studio/save-project:', dbErr);
      res.status(500).json({ error: 'Failed to save studio project' });
    }
  } catch (err) {
    console.error('Request error in POST /invite/studio/save-project:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Publish / Unpublish Invitation Event
inviteRouter.post('/invite/events/:id/toggle-publish', async (req: Request, res: Response) => {
  try {
    const eventId = Number(req.params.id || 1);
    const isPublished = Boolean(req.body?.isPublished);
    const actorEmail = String(req.headers['x-invite-admin-email'] || 'host@invite-luxury.ir');
    try {
      const updated = await inviteService.toggleEventPublish(eventId, isPublished, actorEmail);
      res.status(200).json({ success: true, data: updated });
    } catch (dbErr) {
      console.error('Database error in POST /invite/events/:id/toggle-publish:', dbErr);
      res.status(500).json({ error: 'Failed to update publication status' });
    }
  } catch (err) {
    console.error('Request error in POST /invite/events/:id/toggle-publish:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Admin Dashboard Full Overview (Protected by Server-Side RBAC Middleware)
inviteRouter.get(
  '/invite/admin/overview',
  requireAdminRole,
  async (_req: Request, res: Response) => {
    try {
      try {
        const overview = await inviteService.getAdminDashboardFullData();
        res.status(200).json({ success: true, data: overview });
      } catch (dbErr) {
        console.error('Database error in GET /invite/admin/overview:', dbErr);
        res.status(500).json({ error: 'Failed to load admin dashboard data' });
      }
    } catch (err) {
      console.error('Request error in GET /invite/admin/overview:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// 7. Admin Dashboard Actions with Server-Side RBAC & Audit Logging
inviteRouter.post('/invite/admin/action', requireAdminRole, async (req: Request, res: Response) => {
  try {
    const actionType = String(req.body?.actionType || '');
    const payload = (req.body?.payload as Record<string, unknown>) ?? {};
    const actorEmail = String(req.headers['x-invite-admin-email'] || 'admin@invite-luxury.ir');
    const actorRole = String(req.headers['x-invite-admin-role'] || 'super_admin');

    if (!actionType) {
      res.status(400).json({ error: 'actionType is required' });
      return;
    }

    try {
      const result = await inviteService.executeAdminOperation(actorEmail, actorRole, {
        actionType,
        payload,
      });
      const updatedOverview = await inviteService.getAdminDashboardFullData();
      res.status(200).json({
        success: true,
        data: {
          operationResult: result,
          overview: updatedOverview,
        },
      });
    } catch (dbErr) {
      console.error('Database error in POST /invite/admin/action:', dbErr);
      res.status(500).json({ error: 'Administrative database operation failed' });
    }
  } catch (err) {
    console.error('Request error in POST /invite/admin/action:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
