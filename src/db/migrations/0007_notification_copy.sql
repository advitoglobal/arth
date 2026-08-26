-- Notification copy for the telecalling floor: less clock jargon.
UPDATE notifications
SET
  title = regexp_replace(title, ' is past first response$', ' still needs a first call'),
  why = 'You own this enquiry and the first call is late. The clock only runs while the branch is open.'
WHERE title LIKE '%past first response%'
   OR why ILIKE '%working hours%'
   OR why ILIKE '%first response was due%';
