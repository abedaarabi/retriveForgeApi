exports.up = function (knex) {
  return knex.schema
    .createTable("project_name", function (table) {
      table
        .string("projectID", { primaryKey: true })
        .unique()
        .notNullable()
        .index();
      table.string("projectName");
    })

    .createTable("item_name", function (table) {
      table.string("date").unique().notNullable();
      table.integer("elementsCount");
      table.string("id").primary().unique().notNullable();
      table.string("name");
      table
        .string("projectId")

        .notNullable()
        .references("projectID")
        .inTable("project_name")
        .index();
    })
    .createTable("element", function (table) {
      table.string("name");
      table.string("TypeName");
      table.string("Type_Sorting");
      table.string("Workset");
      table.string("CCSTypeID_Type");
      table.string("CCSTypeID");
      table.string("CCSClassCode_Type");
      table.string("externalId");
      table
        .string("objectId")
        .notNullable()
        .references("id")
        .inTable("item_name")
        .index();
      table.string("BIM7AATypeName");
      table.string("BIM7AATypeDescription");
      table.string("BIM7AATypeID");
      table.string("BIM7AATypeNumber");
      table.string("BIM7AATypeCode");
      table.string("BIM7AATypeComments");
      
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTable("element")
    .dropTable("item_name")
    .dropTable("project_name");
};

// exports.config = { transaction: false };
