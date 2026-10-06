    responses = db.query(Response).filter(Response.form_id == form_id).all() 
