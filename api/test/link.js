/*
Data description

All new data link_url will have time stamped for current link_urls
*/

/*
Test blocks
*/
var request = require('supertest')
  , express = require('express');

request = request('http://localhost:6080');

describe('Basic GET /api/link', function(){
  it('GET /api/link - Check the primary base call', function(done){
    request
      .get('/api/link')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text !== '{"message":"Welcome to the Links API!! Only ballers come here!"}') {
          throw new Error("body message is invalid: " + res.text);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a empty link', function(done){
    var timeStamp = Date.now();
    request
      .get('/api/link/' + timeStamp)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text !== '{"message":"No links found","links_found":0}') {
          throw new Error("body message is invalid: " + res.text);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that has something', function(done){
    var linkUrl = "eddy123",
        data;
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || data.result.length !== 3 || data.result[0].link_url !== linkUrl) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });
});

describe('Preview link POST /api/preview', function(){
  var linkUrl = Date.now(),
      testName = "name_for_testing",
      testDescr = "description_for_testing",
      userName = "test_user_name",
      data;

  it('GET /api/link - Getting a empty link with url: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text !== '{"message":"No links found","links_found":0}') {
          throw new Error("body message is invalid: " + res.text);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing with a unique link', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"false","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/1.png')
      .attach('2', 'sample_files/2.png')
      .attach('3', 'sample_files/3.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Updated previous links with new data" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just previewed url: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].temp_link === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });
});

describe('Preview link POST multiple times /api/preview', function(){
  var linkUrl = Date.now() + 10,
      testName = "name_for_testing",
      testDescr = "description_for_testing",
      userName = "test_user_name",
      data;

  it('GET /api/link - Getting a empty link with url: ' + linkUrl, function(done){
    var timeStamp = Date.now();
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text !== '{"message":"No links found","links_found":0}') {
          throw new Error("body message is invalid: " + res.text);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing with 3 files', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"false","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/1.png')
      .attach('2', 'sample_files/2.png')
      .attach('3', 'sample_files/3.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Updated previous links with new data" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just previewed url with 3 files: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].temp_link === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing 1 file', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"}]}')
      .attach('1', 'sample_files/1.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Updated previous links with new data" || 
            data.result.length !== 1 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just previewed url with 1 file: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 1 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].temp_link === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing with 3 files', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"false","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/1.png')
      .attach('2', 'sample_files/2.png')
      .attach('3', 'sample_files/3.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Updated previous links with new data" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just previewed url with 3 files: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].temp_link === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });
});

describe('Finalize link POST /api/finalize', function(){
  var linkUrl = Date.now() + 20,
      testName = "name_for_testing",
      testDescr = "description_for_testing",
      userName = "test_user_name",
      data;

  it('GET /api/link - Getting a empty link with url: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text !== '{"message":"No links found","links_found":0}') {
          throw new Error("body message is invalid: " + res.text);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing with a unique link', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"false","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/1.png')
      .attach('2', 'sample_files/2.png')
      .attach('3', 'sample_files/3.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Updated previous links with new data" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just previewed url: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "false" || 
            data.result[0].name !== testName || 
            data.result[0].temp_link === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('POST /api/finalize - finalizing with a unique link: ' + linkUrl, function(done){
    this.timeout(30000);
    request
      .post('/api/finalize')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"true","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"true","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"true","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/a.png')
      .attach('2', 'sample_files/b.png')
      .attach('3', 'sample_files/c.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Finalized!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "true" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName ||
            data.result[0].amazon_key_preview === undefined ||
            data.result[0].amazon_key_actual === undefined) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just finalized url: ' + linkUrl, function(done){
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "true" || 
            data.result[0].name !== testName || 
            data.result[0].actual_presigned_url === undefined ||
            data.result[0].preview_presigned_url === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('POST /api/preview - previewing with a finalized link', function(done){
    request
      .post('/api/preview')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"false","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"false","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/1.png')
      .attach('2', 'sample_files/2.png')
      .attach('3', 'sample_files/3.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(409)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Link has already been finalized!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "true" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('POST /api/finalize - finalizing with a unique link: ' + linkUrl, function(done){
    request
      .post('/api/finalize')
      .field('data', '{"link_url":"' + 
        linkUrl + '","data":[{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + 
        '","final":"true","fieldfilename":"1"},{"name":"' + testName + 
        '","description":"' + testDescr + '","media_type":"picture","user_name":"' + userName + 
        '","final":"true","fieldfilename":"2"},{"name":"' + testName + '","description":"' + testDescr + 
        '","media_type":"picture","user_name":"' + userName + '","final":"true","fieldfilename":"3"}]}')
      .attach('1', 'sample_files/a.png')
      .attach('2', 'sample_files/b.png')
      .attach('3', 'sample_files/c.png')
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(409)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          debugger;
          if (data.message !== "Link has already been finalized!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "true" || 
            data.result[0].name !== testName || 
            data.result[0].user_name !== userName ||
            data.result[0].amazon_key_preview === undefined ||
            data.result[0].amazon_key_actual === undefined) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });

  it('GET /api/link - Getting a link that was just finalized url: ' + linkUrl, function(done){
    this.timeout(30000);
    request
      .get('/api/link/' + linkUrl)
      .set('Accept', 'application/json')
      .expect('content-type', 'application/json')
      .expect(200)
      .expect(function(res){
        if (res.text) {
          data = JSON.parse(res.text);
          if (data.message !== "Links found!" || 
            data.result.length !== 3 || 
            data.result[0].link_url !== linkUrl.toString() ||
            data.result[0].description !== testDescr || 
            data.result[0].final !== "true" || 
            data.result[0].name !== testName || 
            data.result[0].actual_presigned_url === undefined ||
            data.result[0].preview_presigned_url === undefined ||
            data.result[0].user_name !== userName) {
            throw new Error("returned data is wrong... " + res.text);
          }
        } else {
          throw new Error("returned data is wrong... " + res);
        }
      })
      .end(done);
  });
});